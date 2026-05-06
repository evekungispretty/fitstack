'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Tabs, Descriptions, Statistic, Row, Col, Table, Progress, Timeline,
  Tag, Avatar, Typography, Breadcrumb, Input, Button, message, Skeleton, Empty,
  Select, Form, Modal,
} from 'antd'
import { CheckCircleFilled, ClockCircleOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

const { Title, Text } = Typography

function goalColor(goal?: string) {
  const map: Record<string, string> = {
    Strength: 'blue', 'Fat Loss': 'orange', 'Muscle Gain': 'green',
  }
  return map[goal || ''] || 'default'
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [notes, setNotes] = useState('')
  const [notesLoaded, setNotesLoaded] = useState(false)
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false)
  const [addWorkoutForm] = Form.useForm()

  const { data: client, isLoading } = useQuery<any>({
    queryKey: ['client', id],
    queryFn: () => fetch(`/api/trainer/clients/${id}`).then((r) => r.json()),
    onSuccess: (d: any) => {
      if (!notesLoaded) {
        setNotes(d.notes || '')
        setNotesLoaded(true)
      }
    },
  } as any)

  const saveNotes = useMutation({
    mutationFn: (notes: string) =>
      fetch(`/api/trainer/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      }).then((r) => r.json()),
    onSuccess: () => {
      message.success('Notes saved')
      qc.invalidateQueries({ queryKey: ['client', id] })
    },
  })

  const addWorkoutMutation = useMutation({
    mutationFn: (values: { name: string }) => {
      const programId = (client as any)?.assignedPrograms?.[0]?.program?.id
      return fetch(`/api/programs/${programId}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then((r) => r.json())
    },
    onSuccess: (data) => {
      message.success('Workout added')
      qc.invalidateQueries({ queryKey: ['client', id] })
      setAddWorkoutOpen(false)
      addWorkoutForm.resetFields()
      const programId = (client as any)?.assignedPrograms?.[0]?.program?.id
      router.push(`/trainer/programs/${programId}/workout/${data.id}`)
    },
    onError: () => message.error('Failed to add workout'),
  })

  if (isLoading) return (
    <div>
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  )

  if (!client || client.error) return (
    <Empty description="Client not found" />
  )

  const assignedProgram = client.assignedPrograms?.[0]
  const workouts = assignedProgram?.program?.workouts || []

  const workoutLogColumns = [
    { title: 'Workout', dataIndex: 'name', key: 'name' },
    { title: 'Exercises', key: 'ex', render: (_: any, w: any) => `${w.exercises?.length || 0} exercises` },
    {
      title: 'Last Done',
      key: 'last',
      render: (_: any, w: any) => {
        const log = w.logs?.[0]
        return log ? (
          <Text type="secondary" style={{ fontSize: 12 }}>{formatDistanceToNow(new Date(log.date), { addSuffix: true })}</Text>
        ) : <Text type="secondary">Not started</Text>
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, w: any) => {
        const log = w.logs?.[0]
        return log?.completed ? (
          <Tag color="success" icon={<CheckCircleFilled />}>Done</Tag>
        ) : (
          <Tag color="default" icon={<ClockCircleOutlined />}>Pending</Tag>
        )
      },
    },
  ]

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8}>
              <Card><Statistic title="Current Weight" value={client.currentWeight || '—'} suffix={client.currentWeight ? 'kg' : ''} /></Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card><Statistic title="Target Weight" value={client.targetWeight || '—'} suffix={client.targetWeight ? 'kg' : ''} /></Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card><Statistic title="Start Weight" value={client.startWeight || '—'} suffix={client.startWeight ? 'kg' : ''} /></Card>
            </Col>
          </Row>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Goal">
              {client.goal ? <Tag color={goalColor(client.goal)}>{client.goal}</Tag> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned Program">
              {assignedProgram ? (
                <Link href={`/trainer/programs/${assignedProgram.program.id}`}>
                  {assignedProgram.program.name}
                </Link>
              ) : 'None'}
            </Descriptions.Item>
            <Descriptions.Item label="Member Since">
              {new Date(client.user.createdAt).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'workouts',
      label: 'Workouts',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {assignedProgram ? `Program: ${assignedProgram.program.name}` : 'No program assigned'}
            </Text>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddWorkoutOpen(true)}
              disabled={!assignedProgram}
              title={!assignedProgram ? 'Assign a program first' : undefined}
            >
              Add Workout
            </Button>
          </div>
          <Table
              dataSource={workouts}
              columns={[
                ...workoutLogColumns,
                {
                  title: '',
                  key: 'edit',
                  width: 60,
                  render: (_: any, w: any) => (
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => router.push(`/trainer/programs/${assignedProgram?.program.id}/workout/${w.id}`)}
                    >
                      Edit
                    </Button>
                  ),
                },
              ]}
              rowKey="id"
              size="small"
              pagination={false}
              expandable={{
                expandedRowRender: (w: any) => {
                  const log = w.logs?.[0]
                  const logSets: any[] = log?.sets || []
                  return (
                    <div style={{ padding: '8px 16px' }}>
                      {log?.notes && (
                        <div style={{ marginBottom: 12 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>Client note: </Text>
                          <Text italic>"{log.notes}"</Text>
                        </div>
                      )}
                      {w.exercises?.map((we: any) => {
                        const exSets = logSets.filter((s: any) => s.exerciseId === we.exerciseId)
                        if (exSets.length === 0) return null
                        return (
                          <div key={we.id} style={{ marginBottom: 12 }}>
                            <div style={{ marginBottom: 4 }}>
                              <Text strong style={{ fontSize: 13 }}>{we.exercise.name}</Text>
                              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                Target: {we.sets}×{we.reps}{we.rpe ? ` @RPE ${we.rpe}` : ''}
                              </Text>
                            </div>
                            <Table
                              dataSource={exSets.map((s: any) => ({ ...s, key: `${s.exerciseId}-${s.setNumber}` }))}
                              columns={[
                                { title: 'Set', dataIndex: 'setNumber', key: 'set', width: 50 },
                                { title: 'Weight', dataIndex: 'weight', key: 'weight', render: (v: any) => v != null ? `${v} kg` : '—' },
                                { title: 'Reps', dataIndex: 'reps', key: 'reps', render: (v: any) => v ?? '—' },
                                { title: 'RPE', dataIndex: 'rpe', key: 'rpe', render: (v: any) => v != null ? <Tag color="warning">RPE {v}</Tag> : '—' },
                              ]}
                              size="small"
                              pagination={false}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                },
                rowExpandable: (w: any) => w.logs?.[0] != null,
              }}
            />
          <Modal
            title="Add Workout"
            open={addWorkoutOpen}
            onCancel={() => { setAddWorkoutOpen(false); addWorkoutForm.resetFields() }}
            footer={null}
          >
            <Form form={addWorkoutForm} layout="vertical" onFinish={(v) => addWorkoutMutation.mutate(v)} style={{ marginTop: 16 }}>
              <Form.Item label="Workout Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Day 4 — Lower Body" />
              </Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button style={{ marginRight: 8 }} onClick={() => { setAddWorkoutOpen(false); addWorkoutForm.resetFields() }}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={addWorkoutMutation.isPending}>Add</Button>
              </div>
            </Form>
          </Modal>
        </div>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      children: (
        <div>
          {client.startWeight && client.targetWeight && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Weight Progress</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {client.startWeight}kg → {client.currentWeight || client.startWeight}kg (target: {client.targetWeight}kg)
                </Text>
              </div>
              <Progress
                percent={Math.round(
                  (Math.abs(client.startWeight - (client.currentWeight || client.startWeight)) /
                    Math.abs(client.startWeight - client.targetWeight)) * 100
                )}
                strokeColor="#52C41A"
              />
            </Card>
          )}
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="More progress data coming soon" />
        </div>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      children: (
        <Card>
          <Input.TextArea
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Trainer notes about this client..."
          />
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Button type="primary" loading={saveNotes.isPending} onClick={() => saveNotes.mutate(notes)}>
              Save Notes
            </Button>
          </div>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Breadcrumb
        items={[
          { title: <Link href="/trainer/clients">Clients</Link> },
          { title: client.user.name },
        ]}
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Avatar size={48} style={{ background: '#1677FF', fontSize: 18 }}>
          {client.user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
        </Avatar>
        <div>
          <Title level={4} style={{ margin: 0 }}>{client.user.name}</Title>
          <Text type="secondary">{client.user.email}</Text>
        </div>
      </div>
      <Card>
        <Tabs items={tabItems} defaultActiveKey="overview" />
      </Card>
    </div>
  )
}

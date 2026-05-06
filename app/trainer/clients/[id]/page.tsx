'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Tabs, Descriptions, Statistic, Row, Col, Table, Progress, Timeline,
  Tag, Avatar, Typography, Breadcrumb, Input, Button, message, Skeleton, Empty,
  Select,
} from 'antd'
import { CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons'
import Link from 'next/link'
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
  const qc = useQueryClient()
  const [notes, setNotes] = useState('')
  const [notesLoaded, setNotesLoaded] = useState(false)

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
      children: workouts.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No workouts in assigned program" />
      ) : (
        <Table
          dataSource={workouts}
          columns={workoutLogColumns}
          rowKey="id"
          size="small"
          pagination={false}
        />
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

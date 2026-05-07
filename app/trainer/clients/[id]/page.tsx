'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Tabs, Descriptions, Statistic, Row, Col, Table, Progress,
  Tag, Avatar, Typography, Breadcrumb, Input, Button, message, Skeleton, Empty,
  Form, Modal, Collapse, Space, Flex, Popconfirm,
} from 'antd'
import {
  CheckCircleFilled, ClockCircleOutlined, PlusOutlined, EditOutlined,
  CopyOutlined, DeleteOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'

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
    mutationFn: (values: { name: string }) =>
      fetch(`/api/trainer/clients/${id}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      message.success('Workout added')
      qc.invalidateQueries({ queryKey: ['client', id] })
      setAddWorkoutOpen(false)
      addWorkoutForm.resetFields()
      router.push(`/trainer/programs/${data.programId}/workout/${data.id}`)
    },
    onError: () => message.error('Failed to add workout'),
  })

  const deleteWorkout = useMutation({
    mutationFn: (workoutId: string) =>
      fetch(`/api/workouts/${workoutId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      message.success('Workout deleted')
      qc.invalidateQueries({ queryKey: ['client', id] })
    },
    onError: () => message.error('Failed to delete workout'),
  })

  const duplicateWorkout = useMutation({
    mutationFn: async (workout: any) => {
      const programId = (client as any)?.assignedPrograms?.[0]?.program?.id
      const created = await fetch(`/api/programs/${programId}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${workout.name} (copy)` }),
      }).then((r) => r.json())
      if (workout.exercises?.length > 0) {
        await fetch(`/api/workouts/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: created.name,
            exercises: workout.exercises.map((we: any) => ({
              exerciseId: we.exerciseId,
              sets: we.sets,
              reps: we.reps,
              rpe: we.rpe || null,
              notes: we.notes || null,
            })),
          }),
        })
      }
      return { ...created, programId }
    },
    onSuccess: (data) => {
      message.success('Workout duplicated')
      qc.invalidateQueries({ queryKey: ['client', id] })
      router.push(`/trainer/programs/${data.programId}/workout/${data.id}`)
    },
    onError: () => message.error('Failed to duplicate'),
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
  const workouts: any[] = assignedProgram?.program?.workouts || []

  // Group workouts into weeks based on dayIndex
  const startDate = assignedProgram?.startDate ? new Date(assignedProgram.startDate) : null

  function getWeekStatus(ws: any[]) {
    if (ws.every((w: any) => w.logs?.[0]?.completed)) return 'completed'
    if (ws.some((w: any) => w.logs?.[0] != null)) return 'in_progress'
    return 'not_started'
  }

  const weekGroups = (() => {
    if (!workouts.length) return []
    const byWeek: Record<number, any[]> = {}
    for (const w of workouts) {
      const wn = Math.floor(w.dayIndex / 7)
      if (!byWeek[wn]) byWeek[wn] = []
      byWeek[wn].push(w)
    }
    return Object.entries(byWeek)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([wn, ws]) => {
        const n = Number(wn)
        const weekStart = startDate ? new Date(startDate.getTime() + n * 7 * 86400000) : null
        const weekEnd = startDate ? new Date(startDate.getTime() + (n + 1) * 7 * 86400000 - 86400000) : null
        return { weekNum: n, workouts: ws as any[], weekStart, weekEnd, status: getWeekStatus(ws as any[]) }
      })
  })()

  function exerciseCols(log: any) {
    return [
      {
        title: 'Exercise',
        key: 'exercise',
        render: (_: any, we: any) => (
          <div>
            <Text strong style={{ fontSize: 12 }}>{we.exercise.name}</Text>
            <br />
            <Tag style={{ fontSize: 10, marginTop: 2 }}>{we.exercise.muscle}</Tag>
          </div>
        ),
      },
      { title: 'Sets', dataIndex: 'sets', key: 'sets', width: 50, render: (v: any) => <Text style={{ fontSize: 12 }}>{v}</Text> },
      { title: 'Reps', dataIndex: 'reps', key: 'reps', width: 70, render: (v: any) => <Text style={{ fontSize: 12 }}>{v}</Text> },
      {
        title: 'Last Weight',
        key: 'weight',
        width: 100,
        render: (_: any, we: any) => {
          if (!log?.sets?.length) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          const logSets = (log.sets as any[]).filter((s) => s.exerciseId === we.exerciseId)
          if (!logSets.length) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          const maxWeight = Math.max(...logSets.map((s) => s.weight || 0))
          return maxWeight > 0
            ? <Text style={{ fontSize: 12 }}>{maxWeight} kg</Text>
            : <Text type="secondary" style={{ fontSize: 12 }}>BW</Text>
        },
      },
      {
        title: 'Notes',
        dataIndex: 'notes',
        key: 'notes',
        render: (v: any) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '—'}</Text>,
      },
    ]
  }

  const collapseItems = weekGroups.map((week) => ({
    key: String(week.weekNum),
    label: (
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Text strong>Week {week.weekNum + 1}</Text>
        {week.weekStart && week.weekEnd && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {format(week.weekStart, 'MMM d')} – {format(week.weekEnd, 'MMM d')}
          </Text>
        )}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {week.workouts.length} workout{week.workouts.length !== 1 ? 's' : ''}
        </Text>
        {week.status === 'completed' ? (
          <Tag color="success">Completed</Tag>
        ) : week.status === 'in_progress' ? (
          <Tag color="processing">In Progress</Tag>
        ) : (
          <Tag>Not Started</Tag>
        )}
      </div>
    ),
    children: (
      <Flex vertical gap={12} style={{ width: '100%' }}>
        {week.workouts.map((w: any) => {
          const log = w.logs?.[0]
          return (
            <div
              key={w.id}
              style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 16px', background: '#fafafa' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <Text strong style={{ fontSize: 14 }}>{w.name}</Text>
                  {log && (
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      Last done {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                    </Text>
                  )}
                  <div style={{ marginTop: 4 }}>
                    {log?.completed ? (
                      <Tag color="success" icon={<CheckCircleFilled />} style={{ fontSize: 11 }}>Done</Tag>
                    ) : log ? (
                      <Tag color="processing" icon={<ClockCircleOutlined />} style={{ fontSize: 11 }}>In Progress</Tag>
                    ) : (
                      <Tag icon={<ClockCircleOutlined />} style={{ fontSize: 11 }}>Pending</Tag>
                    )}
                  </div>
                </div>
                <Space size={0}>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => router.push(`/trainer/programs/${assignedProgram?.program.id}/workout/${w.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    loading={duplicateWorkout.isPending}
                    onClick={() => duplicateWorkout.mutate(w)}
                  >
                    Duplicate
                  </Button>
                  <Popconfirm
                    title="Delete this workout?"
                    description="This cannot be undone."
                    onConfirm={() => deleteWorkout.mutate(w.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
              {w.exercises?.length > 0 ? (
                <Table
                  dataSource={w.exercises}
                  columns={exerciseCols(log)}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  style={{ marginTop: 4 }}
                />
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>No exercises added yet. Click Edit to add exercises.</Text>
              )}
              {log?.notes && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Client note: </Text>
                  <Text italic style={{ fontSize: 12 }}>"{log.notes}"</Text>
                </div>
              )}
            </div>
          )
        })}
      </Flex>
    ),
  }))

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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddWorkoutOpen(true)}
            >
              Add Workout
            </Button>
          </div>
          {workouts.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Flex vertical gap={4}>
                  <Text>No workouts assigned yet</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Create a workout for this client to start building their training plan.
                  </Text>
                </Flex>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddWorkoutOpen(true)}>
                Add Workout
              </Button>
            </Empty>
          ) : (
            <Collapse
              items={collapseItems}
              defaultActiveKey={weekGroups.map((w) => String(w.weekNum))}
            />
          )}
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

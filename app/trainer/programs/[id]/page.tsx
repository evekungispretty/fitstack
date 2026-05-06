'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Table, Button, Typography, Breadcrumb, Tag, message,
  Skeleton, Empty, Space, Modal, Form, Input,
} from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addForm] = Form.useForm()

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', id],
    queryFn: () => fetch(`/api/programs/${id}`).then((r) => r.json()),
  })

  const addWorkout = useMutation({
    mutationFn: (values: any) =>
      fetch(`/api/programs/${id}/workouts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }).then((r) => r.json()),
    onSuccess: (data) => {
      message.success('Workout added')
      qc.invalidateQueries({ queryKey: ['program', id] })
      setAddModalOpen(false)
      addForm.resetFields()
      router.push(`/trainer/programs/${id}/workout/${data.id}`)
    },
    onError: () => message.error('Failed to add workout'),
  })

  const updateName = useMutation({
    mutationFn: (name: string) =>
      fetch(`/api/programs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then((r) => r.json()),
    onSuccess: () => { message.success('Name updated'); qc.invalidateQueries({ queryKey: ['program', id] }) },
  })

  if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />
  if (!program || program.error) return <Empty description="Program not found" />

  const workoutColumns = [
    {
      title: '#',
      dataIndex: 'dayIndex',
      key: 'day',
      width: 48,
      render: (d: number) => <Text type="secondary">{d + 1}</Text>,
    },
    {
      title: 'Workout',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Exercises',
      key: 'ex',
      render: (_: any, w: any) => (
        <Space>
          {w.exercises?.slice(0, 3).map((we: any) => (
            <Tag key={we.id} style={{ fontSize: 11 }}>{we.exercise.name}</Tag>
          ))}
          {(w.exercises?.length || 0) > 3 && (
            <Text type="secondary" style={{ fontSize: 11 }}>+{w.exercises.length - 3} more</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, w: any) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => router.push(`/trainer/programs/${id}/workout/${w.id}`)}
        >
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Breadcrumb
        items={[
          { title: <Link href="/trainer/programs">Programs</Link> },
          { title: program.name },
        ]}
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title
          level={4}
          style={{ margin: 0 }}
          editable={{ onChange: (v) => { if (v && v !== program.name) updateName.mutate(v) } }}
        >
          {program.name}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
          Add Workout
        </Button>
      </div>

      {program.assigned?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Assigned to: </Text>
          {program.assigned.map((a: any) => (
            <Tag key={a.id} style={{ marginLeft: 4 }}>{a.clientProfile.user.name}</Tag>
          ))}
        </div>
      )}

      <Card>
        {program.workouts?.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No workouts yet">
            <Button type="primary" onClick={() => setAddModalOpen(true)}>Add First Workout</Button>
          </Empty>
        ) : (
          <Table
            dataSource={program.workouts}
            columns={workoutColumns}
            rowKey="id"
            size="small"
            pagination={false}
            onRow={(record) => ({ onClick: () => router.push(`/trainer/programs/${id}/workout/${record.id}`) })}
            style={{ cursor: 'pointer' }}
          />
        )}
      </Card>

      <Modal
        title="Add Workout"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); addForm.resetFields() }}
        footer={null}
      >
        <Form form={addForm} layout="vertical" onFinish={(v) => addWorkout.mutate(v)} style={{ marginTop: 16 }}>
          <Form.Item label="Workout Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Day 1 — Upper Push" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => { setAddModalOpen(false); addForm.resetFields() }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={addWorkout.isPending}>Add</Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

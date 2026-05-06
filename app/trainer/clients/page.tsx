'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Table, Button, Drawer, Form, Input, InputNumber, Select, Avatar, Tag,
  Typography, Breadcrumb, Progress, message, Dropdown, Popconfirm, Empty, Skeleton,
} from 'antd'
import { UserAddOutlined, MoreOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

const GOALS = ['Strength', 'Fat Loss', 'Muscle Gain', 'Endurance', 'General Fitness']

function goalColor(goal?: string) {
  const map: Record<string, string> = {
    Strength: 'blue', 'Fat Loss': 'orange', 'Muscle Gain': 'green',
    Endurance: 'cyan', 'General Fitness': 'purple',
  }
  return map[goal || ''] || 'default'
}

export default function ClientsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetch('/api/trainer/clients').then((r) => r.json()),
  })

  const createClient = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/trainer/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e))
        return r.json()
      }),
    onSuccess: () => {
      message.success('Client created')
      qc.invalidateQueries({ queryKey: ['clients'] })
      setDrawerOpen(false)
      form.resetFields()
    },
    onError: (e: any) => message.error(e?.error || 'Failed to create client'),
  })

  const columns = [
    {
      title: 'Client',
      key: 'client',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={36} style={{ background: '#1677FF', flexShrink: 0 }}>
            {record.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.user?.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Goal',
      dataIndex: 'goal',
      key: 'goal',
      render: (goal: string) => goal ? <Tag color={goalColor(goal)}>{goal}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Program',
      key: 'program',
      render: (_: any, r: any) => {
        const ap = r.assignedPrograms?.[0]
        return ap ? <Tag color="blue">{ap.program.name}</Tag> : <Text type="secondary">None</Text>
      },
    },
    {
      title: 'Weight Progress',
      key: 'weight',
      render: (_: any, r: any) => {
        if (!r.startWeight || !r.targetWeight) return <Text type="secondary">—</Text>
        const total = Math.abs(r.startWeight - r.targetWeight)
        const done = Math.abs(r.startWeight - (r.currentWeight || r.startWeight))
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        return (
          <div style={{ minWidth: 100 }}>
            <Text style={{ fontSize: 12 }}>{r.currentWeight}kg → {r.targetWeight}kg</Text>
            <Progress percent={pct} size="small" showInfo={false} />
          </div>
        )
      },
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: 'View Profile', onClick: () => router.push(`/trainer/clients/${record.userId}`) },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Breadcrumb items={[{ title: 'Clients' }]} style={{ marginBottom: 4 }} />
          <Title level={4} style={{ margin: 0 }}>Clients</Title>
        </div>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setDrawerOpen(true)}>
          Add Client
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : clients.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No clients yet">
            <Button type="primary" onClick={() => setDrawerOpen(true)}>Add Your First Client</Button>
          </Empty>
        ) : (
          <Table
            dataSource={clients}
            columns={columns}
            rowKey="id"
            size="small"
            onRow={(record) => ({ onClick: () => router.push(`/trainer/clients/${record.userId}`) })}
            style={{ cursor: 'pointer' }}
          />
        )}
      </Card>

      <Drawer
        title="Add Client"
        placement="right"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields() }}
        width={400}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => { setDrawerOpen(false); form.resetFields() }}>Cancel</Button>
            <Button type="primary" loading={createClient.isPending} onClick={() => form.submit()}>Create Client</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={(values) => createClient.mutate(values)}>
          <Form.Item label="Full Name" name="name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Jordan Lee" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
            <Input placeholder="jordan@example.com" />
          </Form.Item>
          <Form.Item label="Goal" name="goal">
            <Select placeholder="Select goal" options={GOALS.map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          <Form.Item label="Start Weight (kg)" name="startWeight">
            <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
          </Form.Item>
          <Form.Item label="Target Weight (kg)" name="targetWeight">
            <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Any notes about this client..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Table, Button, Modal, Form, Input, Typography,
  Breadcrumb, message, Skeleton, Empty, Tag, Space,
} from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

const { Title, Text } = Typography

export default function ProgramsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetch('/api/programs').then((r) => r.json()),
  })

  const createProgram = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/programs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }).then((r) => r.json()),
    onSuccess: (data) => {
      message.success('Program created')
      qc.invalidateQueries({ queryKey: ['programs'] })
      setModalOpen(false)
      form.resetFields()
      router.push(`/trainer/programs/${data.id}`)
    },
    onError: () => message.error('Failed to create program'),
  })

  const columns = [
    {
      title: 'Program Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Workouts',
      key: 'workouts',
      render: (_: any, r: any) => (
        <Tag>{r._count?.workouts || 0} workouts</Tag>
      ),
    },
    {
      title: 'Assigned Clients',
      key: 'clients',
      render: (_: any, r: any) => (
        <Text type="secondary">{r._count?.assigned || 0} client{r._count?.assigned !== 1 ? 's' : ''}</Text>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'created',
      render: (d: string) => <Text type="secondary">{formatDistanceToNow(new Date(d), { addSuffix: true })}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, r: any) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); router.push(`/trainer/programs/${r.id}`) }}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Breadcrumb items={[{ title: 'Programs' }]} style={{ marginBottom: 4 }} />
          <Title level={4} style={{ margin: 0 }}>Programs</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Program</Button>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : programs.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No programs yet">
            <Button type="primary" onClick={() => setModalOpen(true)}>Create First Program</Button>
          </Empty>
        ) : (
          <Table
            dataSource={programs}
            columns={columns}
            rowKey="id"
            size="small"
            onRow={(record) => ({ onClick: () => router.push(`/trainer/programs/${record.id}`) })}
            style={{ cursor: 'pointer' }}
          />
        )}
      </Card>

      <Modal
        title="New Program"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createProgram.mutate(v)} style={{ marginTop: 16 }}>
          <Form.Item label="Program Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Strength Block A" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => { setModalOpen(false); form.resetFields() }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createProgram.isPending}>Create</Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

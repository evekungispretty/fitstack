'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Table, Button, Modal, Form, Input, Select, Tag, Typography,
  Breadcrumb, Popconfirm, message, Skeleton, Empty, Row, Col, Space,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio']
const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Lats', 'Rear Delt']
const EQUIPMENT = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Resistance Band', 'Kettlebell']

const categoryColor: Record<string, string> = {
  Push: 'blue', Pull: 'green', Legs: 'orange', Core: 'purple', Cardio: 'cyan',
}

export default function ExerciseLibraryPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string | undefined>()
  const [filterMuscle, setFilterMuscle] = useState<string | undefined>()

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
  })

  const createExercise = useMutation({
    mutationFn: (values: any) =>
      fetch('/api/exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e))
        return r.json()
      }),
    onSuccess: () => { message.success('Exercise created'); qc.invalidateQueries({ queryKey: ['exercises'] }); closeModal() },
    onError: () => message.error('Failed to create exercise'),
  })

  const updateExercise = useMutation({
    mutationFn: ({ id, ...values }: any) =>
      fetch(`/api/exercises/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }).then((r) => r.json()),
    onSuccess: () => { message.success('Exercise updated'); qc.invalidateQueries({ queryKey: ['exercises'] }); closeModal() },
    onError: () => message.error('Failed to update exercise'),
  })

  const deleteExercise = useMutation({
    mutationFn: (id: string) => fetch(`/api/exercises/${id}`, { method: 'DELETE' }),
    onSuccess: () => { message.success('Exercise deleted'); qc.invalidateQueries({ queryKey: ['exercises'] }) },
    onError: () => message.error('Failed to delete'),
  })

  function openCreate() { setEditing(null); form.resetFields(); setModalOpen(true) }
  function openEdit(ex: any) { setEditing(ex); form.setFieldsValue(ex); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(null); form.resetFields() }

  function handleSubmit(values: any) {
    if (editing) updateExercise.mutate({ id: editing.id, ...values })
    else createExercise.mutate(values)
  }

  const filtered = exercises.filter((ex: any) => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && ex.category !== filterCat) return false
    if (filterMuscle && ex.muscle !== filterMuscle) return false
    return true
  })

  const columns = [
    {
      title: 'Exercise',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color={categoryColor[cat] || 'default'}>{cat}</Tag>,
    },
    {
      title: 'Muscle Group',
      dataIndex: 'muscle',
      key: 'muscle',
      render: (muscle: string) => <Tag>{muscle}</Tag>,
    },
    {
      title: 'Equipment',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (eq: string) => eq ? <Text type="secondary">{eq}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(record) }} />
          <Popconfirm
            title="Delete this exercise?"
            onConfirm={() => deleteExercise.mutate(record.id)}
            okText="Delete"
            okType="danger"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Breadcrumb items={[{ title: 'Exercise Library' }]} style={{ marginBottom: 4 }} />
          <Title level={4} style={{ margin: 0 }}>Exercise Library</Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Exercise</Button>
      </div>

      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10}>
            <Input.Search
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={7}>
            <Select
              placeholder="Category"
              style={{ width: '100%' }}
              allowClear
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              value={filterCat}
              onChange={setFilterCat}
            />
          </Col>
          <Col xs={12} sm={7}>
            <Select
              placeholder="Muscle group"
              style={{ width: '100%' }}
              allowClear
              options={MUSCLES.map((m) => ({ value: m, label: m }))}
              value={filterMuscle}
              onChange={setFilterMuscle}
            />
          </Col>
        </Row>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : filtered.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No exercises found">
            <Button type="primary" onClick={openCreate}>Add Exercise</Button>
          </Empty>
        ) : (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: false }}
          />
        )}
      </Card>

      <Modal
        title={editing ? 'Edit Exercise' : 'New Exercise'}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Bench Press" />
          </Form.Item>
          <Form.Item label="Category" name="category" rules={[{ required: true }]}>
            <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select category" />
          </Form.Item>
          <Form.Item label="Muscle Group" name="muscle" rules={[{ required: true }]}>
            <Select options={MUSCLES.map((m) => ({ value: m, label: m }))} placeholder="Select muscle" />
          </Form.Item>
          <Form.Item label="Equipment" name="equipment">
            <Select options={EQUIPMENT.map((e) => ({ value: e, label: e }))} placeholder="Select equipment" allowClear />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional description..." />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={closeModal}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createExercise.isPending || updateExercise.isPending}
            >
              {editing ? 'Save Changes' : 'Create Exercise'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

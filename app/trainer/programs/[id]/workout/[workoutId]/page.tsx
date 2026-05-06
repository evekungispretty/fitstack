'use client'

import { use, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Table, Button, Typography, Breadcrumb, Input, InputNumber,
  Select, message, Skeleton, Empty, Drawer, Tag, Space, Tooltip,
} from 'antd'
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import Link from 'next/link'

const { Title, Text } = Typography

const RPE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `RPE ${i + 1}`,
}))

export default function WorkoutBuilderPage({ params }: { params: Promise<{ id: string; workoutId: string }> }) {
  const { id: programId, workoutId } = use(params)
  const qc = useQueryClient()
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState<any[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const { data: workout, isLoading: loadingWorkout } = useQuery<any>({
    queryKey: ['workout', workoutId],
    queryFn: () => fetch(`/api/workouts/${workoutId}`).then((r) => r.json()),
    onSuccess: (d: any) => {
      setWorkoutName(d.name)
      setExercises(
        (d.exercises || []).map((we: any) => ({
          key: we.id,
          exerciseId: we.exerciseId,
          name: we.exercise.name,
          muscle: we.exercise.muscle,
          sets: we.sets,
          reps: we.reps,
          rpe: we.rpe || '',
          notes: we.notes || '',
        }))
      )
    },
  } as any)

  const { data: allExercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => fetch('/api/exercises').then((r) => r.json()),
    enabled: pickerOpen,
  })

  const saveWorkout = useMutation({
    mutationFn: () =>
      fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName,
          exercises: exercises.map((e) => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: String(e.reps),
            rpe: e.rpe || null,
            notes: e.notes || null,
          })),
        }),
      }).then((r) => r.json()),
    onSuccess: () => { message.success('Workout saved'); qc.invalidateQueries({ queryKey: ['workout', workoutId] }) },
    onError: () => message.error('Failed to save'),
  })

  function updateExercise(key: string, field: string, value: any) {
    setExercises((prev) => prev.map((e) => e.key === key ? { ...e, [field]: value } : e))
  }

  function removeExercise(key: string) {
    setExercises((prev) => prev.filter((e) => e.key !== key))
  }

  function addSelectedExercises() {
    const toAdd = allExercises
      .filter((ex: any) => selectedRowKeys.includes(ex.id) && !exercises.find((e) => e.exerciseId === ex.id))
      .map((ex: any) => ({
        key: `new-${ex.id}-${Date.now()}`,
        exerciseId: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        sets: 3,
        reps: '8-10',
        rpe: '',
        notes: '',
      }))
    setExercises((prev) => [...prev, ...toAdd])
    setSelectedRowKeys([])
    setPickerOpen(false)
  }

  const filteredPicker = allExercises.filter((ex: any) =>
    ex.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    ex.muscle.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  const columns = [
    {
      title: '#',
      key: 'order',
      width: 40,
      render: (_: any, __: any, idx: number) => <Text type="secondary">{idx + 1}</Text>,
    },
    {
      title: 'Exercise',
      key: 'exercise',
      render: (_: any, record: any) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Tag style={{ fontSize: 11, marginTop: 2 }}>{record.muscle}</Tag>
        </div>
      ),
    },
    {
      title: 'Sets',
      key: 'sets',
      width: 80,
      render: (_: any, record: any) => (
        <InputNumber
          min={1} max={20}
          value={record.sets}
          onChange={(v) => updateExercise(record.key, 'sets', v)}
          style={{ width: '100%' }}
          size="small"
        />
      ),
    },
    {
      title: 'Reps',
      key: 'reps',
      width: 100,
      render: (_: any, record: any) => (
        <Input
          value={record.reps}
          onChange={(e) => updateExercise(record.key, 'reps', e.target.value)}
          placeholder="8-10"
          size="small"
        />
      ),
    },
    {
      title: 'RPE',
      key: 'rpe',
      width: 110,
      render: (_: any, record: any) => (
        <Select
          value={record.rpe || undefined}
          onChange={(v) => updateExercise(record.key, 'rpe', v)}
          options={RPE_OPTIONS}
          placeholder="—"
          allowClear
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (_: any, record: any) => (
        <Input
          value={record.notes}
          onChange={(e) => updateExercise(record.key, 'notes', e.target.value)}
          placeholder="Optional..."
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'delete',
      width: 48,
      render: (_: any, record: any) => (
        <Tooltip title="Remove">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeExercise(record.key)}
          />
        </Tooltip>
      ),
    },
  ]

  const pickerColumns = [
    {
      title: 'Exercise',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Muscle',
      dataIndex: 'muscle',
      key: 'muscle',
      render: (m: string) => <Tag style={{ fontSize: 11 }}>{m}</Tag>,
    },
    {
      title: 'Equipment',
      dataIndex: 'equipment',
      key: 'equipment',
      render: (e: string) => <Text type="secondary" style={{ fontSize: 12 }}>{e || '—'}</Text>,
    },
  ]

  if (loadingWorkout) return <Skeleton active paragraph={{ rows: 8 }} />

  return (
    <div>
      <Breadcrumb
        items={[
          { title: <Link href="/trainer/programs">Programs</Link> },
          { title: <Link href={`/trainer/programs/${programId}`}>{workout?.program?.name || 'Program'}</Link> },
          { title: workoutName },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Input
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          style={{ fontSize: 20, fontWeight: 600, width: 360, border: 'none', padding: 0 }}
          placeholder="Workout name..."
        />
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>Add Exercise</Button>
          <Button type="primary" loading={saveWorkout.isPending} onClick={() => saveWorkout.mutate()}>Save Workout</Button>
        </Space>
      </div>

      <Card>
        {exercises.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No exercises yet">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>Add Exercise</Button>
          </Empty>
        ) : (
          <Table
            dataSource={exercises}
            columns={columns}
            rowKey="key"
            size="small"
            pagination={false}
          />
        )}
      </Card>

      <Drawer
        title="Add Exercises"
        placement="right"
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerSearch(''); setSelectedRowKeys([]) }}
        width={560}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={() => { setPickerOpen(false); setSelectedRowKeys([]) }}>Cancel</Button>
            <Button type="primary" disabled={selectedRowKeys.length === 0} onClick={addSelectedExercises}>
              Add {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
            </Button>
          </div>
        }
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search exercises..."
          value={pickerSearch}
          onChange={(e) => setPickerSearch(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
        />
        <Table
          dataSource={filteredPicker}
          columns={pickerColumns}
          rowKey="id"
          size="small"
          loading={loadingExercises}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
            getCheckboxProps: (record) => ({
              disabled: exercises.some((e) => e.exerciseId === (record as any).id),
            }),
          }}
        />
      </Drawer>
    </div>
  )
}

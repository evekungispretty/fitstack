'use client'

import { use, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Collapse, Table, InputNumber, Select, Checkbox, Typography,
  Button, Steps, Modal, message, Skeleton, Empty, Breadcrumb, Tag, Progress, Input,
} from 'antd'
import { CheckOutlined, TrophyOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const { Title, Text } = Typography

const RPE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `RPE ${i + 1}`,
}))

export default function WorkoutLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workoutId } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [sets, setSets] = useState<Record<string, any[]>>({})
  const [workoutNote, setWorkoutNote] = useState('')
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<string[]>([])

  const { data: workout, isLoading } = useQuery<any>({
    queryKey: ['workout', workoutId],
    queryFn: () => fetch(`/api/workouts/${workoutId}`).then((r) => r.json()),
  })

  useEffect(() => {
    if (!workout?.exercises || Object.keys(sets).length > 0) return
    const initial: Record<string, any[]> = {}
    for (const we of workout.exercises) {
      initial[we.exerciseId] = Array.from({ length: we.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: '',
        reps: '',
        rpe: '',
        done: false,
      }))
    }
    setSets(initial)
    setActiveKey([workout.exercises[0]?.exerciseId])
  }, [workout])

  const { data: prevLog } = useQuery({
    queryKey: ['prev-log', workoutId],
    queryFn: () => fetch(`/api/client/logs/${workoutId}`).then((r) => r.json()),
  })

  const saveLog = useMutation({
    mutationFn: (completed: boolean) => {
      const allSets: any[] = []
      for (const [exerciseId, exerciseSets] of Object.entries(sets)) {
        for (const s of exerciseSets) {
          if (s.done) {
            allSets.push({
              exerciseId,
              setNumber: s.setNumber,
              weight: s.weight || null,
              reps: s.reps || null,
              rpe: s.rpe || null,
            })
          }
        }
      }
      return fetch('/api/client/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId, sets: allSets, notes: workoutNote || null, completed }),
      }).then((r) => r.json())
    },
    onSuccess: (_, completed) => {
      if (completed) {
        message.success('Workout completed! 🎉')
        qc.invalidateQueries({ queryKey: ['client-dashboard'] })
        router.push('/client/history')
      }
    },
    onError: () => message.error('Failed to save'),
  })

  function updateSet(exerciseId: string, setIdx: number, field: string, value: any) {
    setSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? { ...s, [field]: value } : s),
    }))
  }

  function getPrevSet(exerciseId: string, setNumber: number) {
    if (!prevLog?.sets) return null
    return prevLog.sets.find((s: any) => s.exerciseId === exerciseId && s.setNumber === setNumber)
  }

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (!workout || workout.error) return <Empty description="Workout not found" />

  const exercises = workout.exercises || []
  const totalSets = Object.values(sets).reduce((acc, s) => acc + s.length, 0)
  const doneSets = Object.values(sets).reduce((acc, s) => acc + s.filter((x) => x.done).length, 0)
  const completionPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0

  const setColumns = (exerciseId: string) => [
    { title: 'Set', dataIndex: 'setNumber', key: 'set', width: 48, render: (n: number) => <Text type="secondary">{n}</Text> },
    {
      title: 'Weight (kg)',
      key: 'weight',
      render: (_: any, record: any, idx: number) => {
        const prev = getPrevSet(exerciseId, record.setNumber)
        return (
          <InputNumber
            min={0} step={2.5}
            value={record.weight}
            onChange={(v) => updateSet(exerciseId, idx, 'weight', v)}
            placeholder={prev?.weight ? String(prev.weight) : undefined}
            size="small"
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: 'Reps',
      key: 'reps',
      render: (_: any, record: any, idx: number) => {
        const prev = getPrevSet(exerciseId, record.setNumber)
        return (
          <InputNumber
            min={0} max={100}
            value={record.reps}
            onChange={(v) => updateSet(exerciseId, idx, 'reps', v)}
            placeholder={prev?.reps ? String(prev.reps) : undefined}
            size="small"
            style={{ width: '100%' }}
          />
        )
      },
    },
    {
      title: 'RPE',
      key: 'rpe',
      width: 110,
      render: (_: any, record: any, idx: number) => (
        <Select
          value={record.rpe || undefined}
          onChange={(v) => updateSet(exerciseId, idx, 'rpe', v)}
          options={RPE_OPTIONS}
          placeholder="—"
          allowClear
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: <CheckOutlined />,
      key: 'done',
      width: 48,
      render: (_: any, record: any, idx: number) => (
        <Checkbox
          checked={record.done}
          onChange={(e) => updateSet(exerciseId, idx, 'done', e.target.checked)}
        />
      ),
    },
  ]

  const stepsItems = exercises.map((we: any, idx: number) => {
    const exSets = sets[we.exerciseId] || []
    const exDone = exSets.filter((s) => s.done).length
    const allDone = exSets.length > 0 && exDone === exSets.length
    return {
      title: we.exercise.name,
      status: allDone ? 'finish' : exDone > 0 ? 'process' : 'wait',
    }
  })

  const collapseItems = exercises.map((we: any) => {
    const exSets = sets[we.exerciseId] || []
    const exDone = exSets.filter((s) => s.done).length
    return {
      key: we.exerciseId,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong>{we.exercise.name}</Text>
          <Tag style={{ fontSize: 11 }}>{we.exercise.muscle}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>{we.sets} × {we.reps}</Text>
          {we.rpe && <Tag color="warning" style={{ fontSize: 11 }}>RPE {we.rpe}</Tag>}
          {exDone === exSets.length && exSets.length > 0 && (
            <Tag color="success" style={{ fontSize: 11 }}>✓ Done</Tag>
          )}
        </div>
      ),
      children: (
        <Table
          dataSource={exSets.map((s) => ({ ...s, key: `${we.exerciseId}-${s.setNumber}` }))}
          columns={setColumns(we.exerciseId)}
          size="small"
          pagination={false}
        />
      ),
    }
  })

  return (
    <div>
      <Breadcrumb
        items={[
          { title: <Link href="/client/dashboard">Today</Link> },
          { title: workout.name },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{workout.name}</Title>
          <Text type="secondary">{workout.program?.name}</Text>
        </div>
        <Button
          type="primary"
          icon={<TrophyOutlined />}
          onClick={() => setCompleteModalOpen(true)}
          disabled={doneSets === 0}
        >
          Complete
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">Progress: {doneSets}/{totalSets} sets done</Text>
        </div>
        <Progress percent={completionPct} strokeColor="#52C41A" />
      </Card>

      {exercises.length > 2 && (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <Steps
            size="small"
            items={stepsItems}
            style={{ minWidth: exercises.length * 120 }}
          />
        </div>
      )}

      <Collapse
        activeKey={activeKey}
        onChange={(keys) => setActiveKey(Array.isArray(keys) ? keys : [keys])}
        items={collapseItems}
        accordion={false}
      />

      <Card style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Workout Note</Text>
        <Input.TextArea
          rows={2}
          value={workoutNote}
          onChange={(e) => setWorkoutNote(e.target.value)}
          placeholder="How did it feel? Any notes for your trainer..."
        />
      </Card>

      <Modal
        title="Complete Workout"
        open={completeModalOpen}
        onCancel={() => setCompleteModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setCompleteModalOpen(false)}>Cancel</Button>,
          <Button
            key="complete"
            type="primary"
            icon={<TrophyOutlined />}
            loading={saveLog.isPending}
            onClick={() => { setCompleteModalOpen(false); saveLog.mutate(true) }}
          >
            Yes, Complete!
          </Button>,
        ]}
      >
        <p>You've logged {doneSets} out of {totalSets} sets. Mark this workout as complete?</p>
      </Modal>
    </div>
  )
}

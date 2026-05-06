'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card, Table, Tag, Typography, Breadcrumb, Drawer, Descriptions, Empty, Skeleton,
} from 'antd'
import { CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons'
import { formatDistanceToNow, format } from 'date-fns'

const { Title, Text } = Typography

export default function HistoryPage() {
  const [drawerLog, setDrawerLog] = useState<any>(null)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['client-logs'],
    queryFn: () => fetch('/api/client/logs').then((r) => r.json()),
  })

  function totalVolume(sets: any[]) {
    return sets.reduce((acc: number, s: any) => {
      if (s.weight && s.reps) return acc + s.weight * s.reps
      return acc
    }, 0)
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => (
        <div>
          <Text>{format(new Date(d), 'MMM d, yyyy')}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{formatDistanceToNow(new Date(d), { addSuffix: true })}</Text>
        </div>
      ),
    },
    {
      title: 'Workout',
      key: 'workout',
      render: (_: any, r: any) => <Text strong>{r.workout?.name}</Text>,
    },
    {
      title: 'Sets Logged',
      key: 'sets',
      render: (_: any, r: any) => <Text>{r.sets?.length || 0} sets</Text>,
    },
    {
      title: 'Volume',
      key: 'volume',
      render: (_: any, r: any) => {
        const vol = totalVolume(r.sets || [])
        return vol > 0 ? <Text>{vol.toLocaleString()} kg</Text> : <Text type="secondary">—</Text>
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, r: any) => r.completed ? (
        <Tag color="success" icon={<CheckCircleFilled />}>Completed</Tag>
      ) : (
        <Tag color="default" icon={<ClockCircleOutlined />}>Partial</Tag>
      ),
    },
    {
      title: '',
      key: 'view',
      width: 60,
      render: (_: any, r: any) => (
        <a onClick={() => setDrawerLog(r)} style={{ fontSize: 13 }}>View</a>
      ),
    },
  ]

  return (
    <div>
      <Breadcrumb items={[{ title: 'History' }]} style={{ marginBottom: 8 }} />
      <Title level={4} style={{ marginBottom: 16 }}>Workout History</Title>

      <Card>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : logs.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No workouts logged yet" />
        ) : (
          <Table
            dataSource={logs}
            columns={columns}
            rowKey="id"
            size="small"
          />
        )}
      </Card>

      <Drawer
        title={drawerLog ? `${drawerLog.workout?.name} — ${format(new Date(drawerLog.date), 'MMM d, yyyy')}` : ''}
        open={!!drawerLog}
        onClose={() => setDrawerLog(null)}
        width={420}
      >
        {drawerLog && (
          <div>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Status">
                {drawerLog.completed ? <Tag color="success">Completed</Tag> : <Tag>Partial</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Sets">
                {drawerLog.sets?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total Volume">
                {totalVolume(drawerLog.sets || [])} kg
              </Descriptions.Item>
            </Descriptions>

            <Table
              size="small"
              dataSource={drawerLog.sets?.map((s: any, i: number) => ({ ...s, key: i }))}
              columns={[
                { title: 'Set', dataIndex: 'setNumber', width: 48 },
                { title: 'Weight (kg)', dataIndex: 'weight', render: (v: any) => v || '—' },
                { title: 'Reps', dataIndex: 'reps', render: (v: any) => v || '—' },
                { title: 'RPE', dataIndex: 'rpe', render: (v: any) => v || '—' },
              ]}
              pagination={false}
            />

            {drawerLog.notes && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Notes: </Text>
                <Text>{drawerLog.notes}</Text>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

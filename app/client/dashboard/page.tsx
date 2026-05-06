'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Card, Row, Col, Statistic, Alert, Button, Timeline, Typography,
  Skeleton, Empty, Tag, Badge,
} from 'antd'
import { ThunderboltOutlined, FireOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

const { Title, Text } = Typography

export default function ClientDashboard() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: () => fetch('/api/client/dashboard').then((r) => r.json()),
  })

  const assignedProgram = data?.profile?.assignedPrograms?.[0]
  const workouts = assignedProgram?.program?.workouts || []
  const todayWorkout = workouts[0]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Today</Title>
        <Text type="secondary">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : todayWorkout ? (
        <Alert
          type="info"
          showIcon
          icon={<ThunderboltOutlined />}
          message={<Text strong>Today's Workout: {todayWorkout.name}</Text>}
          description={
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                {todayWorkout.exercises?.length || 0} exercises · {assignedProgram?.program?.name}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  onClick={() => router.push(`/client/workout/${todayWorkout.id}/log`)}
                >
                  Start Workout
                </Button>
              </div>
            </div>
          }
          style={{ marginBottom: 24 }}
        />
      ) : (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="No workout scheduled for today"
          description="Check back with your trainer for your next session."
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            {isLoading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title="Current Weight"
                value={data?.profile?.currentWeight || '—'}
                suffix={data?.profile?.currentWeight ? 'kg' : ''}
              />
            )}
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            {isLoading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title="Workouts This Month"
                value={data?.workoutsThisMonth || 0}
                prefix={<FireOutlined style={{ color: '#FF4D4F' }} />}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            {isLoading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title="Active Program"
                value={assignedProgram?.program?.name || 'None assigned'}
                valueStyle={{ fontSize: 16 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title={<Title level={5} style={{ margin: 0 }}>Recent Workouts</Title>}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : !data?.recentLogs?.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No workouts logged yet">
            {todayWorkout && (
              <Button type="primary" onClick={() => router.push(`/client/workout/${todayWorkout.id}/log`)}>
                Log Today's Workout
              </Button>
            )}
          </Empty>
        ) : (
          <Timeline
            items={data.recentLogs.map((log: any) => ({
              color: log.completed ? 'green' : 'blue',
              dot: log.completed ? <CheckCircleOutlined /> : undefined,
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong>{log.workout.name}</Text>
                    <Badge
                      status={log.completed ? 'success' : 'processing'}
                      text={<Text style={{ fontSize: 12 }} type="secondary">{log.completed ? 'Completed' : 'In Progress'}</Text>}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0 }}
                      onClick={() => router.push(`/client/workout/${log.workoutId}/log`)}
                    >
                      {log.completed ? 'View' : 'Continue'}
                    </Button>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  )
}

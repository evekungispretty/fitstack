'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Row, Col, Card, Statistic, Table, Avatar, Tag, Dropdown, Typography,
  Timeline, Skeleton, Empty, Button, Breadcrumb,
} from 'antd'
import {
  TeamOutlined, AppstoreOutlined, ThunderboltOutlined, CheckCircleOutlined,
  MoreOutlined, UserAddOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

const { Title, Text } = Typography

function goalColor(goal?: string) {
  if (!goal) return 'default'
  if (goal === 'Strength') return 'blue'
  if (goal === 'Fat Loss') return 'orange'
  if (goal === 'Muscle Gain') return 'green'
  return 'default'
}

export default function TrainerDashboard() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: () => fetch('/api/trainer/dashboard').then((r) => r.json()),
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const clientColumns = [
    {
      title: 'Client',
      dataIndex: ['user', 'name'],
      key: 'name',
      render: (name: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={32} style={{ background: '#1677FF', flexShrink: 0 }}>
            {name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
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
      render: (_: any, record: any) => {
        const ap = record.assignedPrograms?.[0]
        return ap ? <Text>{ap.program.name}</Text> : <Text type="secondary">None assigned</Text>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: 'View Profile', onClick: () => router.push(`/trainer/clients/${(record as any).userId}`) },
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
      <Breadcrumb items={[{ title: 'Dashboard' }]} style={{ marginBottom: 16 }} />
      <div style={{ marginBottom: 24 }}>
        {isLoading ? (
          <Skeleton.Input active style={{ width: 280, height: 32 }} />
        ) : (
          <>
            <Title level={4} style={{ margin: 0 }}>{greeting}</Title>
            <Text type="secondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Clients', value: data?.totalClients, icon: <TeamOutlined />, color: '#1677FF' },
          { title: 'Active Programs', value: data?.totalPrograms, icon: <AppstoreOutlined />, color: '#52C41A' },
          { title: 'Workouts This Week', value: data?.workoutsThisWeek, icon: <ThunderboltOutlined />, color: '#FAAD14' },
          { title: 'Avg Compliance', value: '—', icon: <CheckCircleOutlined />, color: '#FF4D4F', suffix: '' },
        ].map((stat) => (
          <Col xs={12} sm={12} md={6} key={stat.title}>
            <Card>
              {isLoading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title={stat.title}
                  value={stat.value ?? 0}
                  suffix={stat.suffix}
                  prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Your Clients</Title>}
            extra={
              <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={() => router.push('/trainer/clients')}>
                Manage
              </Button>
            }
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : data?.clients?.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No clients yet">
                <Button type="primary" onClick={() => router.push('/trainer/clients')}>Add Client</Button>
              </Empty>
            ) : (
              <Table
                dataSource={data?.clients}
                columns={clientColumns}
                rowKey="id"
                size="small"
                pagination={false}
                onRow={(record) => ({ onClick: () => router.push(`/trainer/clients/${(record as any).userId}`) })}
                style={{ cursor: 'pointer' }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<Title level={5} style={{ margin: 0 }}>Recent Activity</Title>}>
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : data?.recentActivity?.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent activity" />
            ) : (
              <Timeline
                items={data?.recentActivity?.map((log: any) => ({
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>{log.user.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{log.workout.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                      </Text>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Descriptions, Tag, Typography, Breadcrumb, InputNumber, Button,
  DatePicker, Row, Col, message, Skeleton, Empty,
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function ProfilePage() {
  const qc = useQueryClient()
  const [newWeight, setNewWeight] = useState<number | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => fetch('/api/client/profile').then((r) => r.json()),
  })

  const logWeight = useMutation({
    mutationFn: (weight: number) =>
      fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentWeight: weight }),
      }).then((r) => r.json()),
    onSuccess: () => {
      message.success('Weight logged!')
      setNewWeight(null)
      qc.invalidateQueries({ queryKey: ['client-profile'] })
    },
    onError: () => message.error('Failed to log weight'),
  })

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />
  if (!profile) return <Empty description="Profile not found" />

  const assignedProgram = profile?.assignedPrograms?.[0]

  return (
    <div>
      <Breadcrumb items={[{ title: 'Profile' }]} style={{ marginBottom: 8 }} />
      <Title level={4} style={{ marginBottom: 16 }}>My Profile</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={<Title level={5} style={{ margin: 0 }}>Profile Info</Title>}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Goal">
                {profile.goal ? <Tag color="blue">{profile.goal}</Tag> : <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Trainer">
                {profile.trainer?.name || <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Active Program">
                {assignedProgram ? (
                  <Tag color="blue">{assignedProgram.program.name}</Tag>
                ) : (
                  <Text type="secondary">None assigned</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<Title level={5} style={{ margin: 0 }}>Weight Stats</Title>}>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Start Weight">
                {profile.startWeight ? `${profile.startWeight} kg` : <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Current Weight">
                {profile.currentWeight ? (
                  <Text strong>{profile.currentWeight} kg</Text>
                ) : <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Target Weight">
                {profile.targetWeight ? `${profile.targetWeight} kg` : <Text type="secondary">—</Text>}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Log new weight</Text>
              <div style={{ display: 'flex', gap: 8 }}>
                <InputNumber
                  placeholder="kg"
                  min={0}
                  step={0.5}
                  value={newWeight}
                  onChange={(v) => setNewWeight(v)}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={logWeight.isPending}
                  disabled={!newWeight}
                  onClick={() => newWeight && logWeight.mutate(newWeight)}
                >
                  Log
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

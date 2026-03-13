import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Empty } from 'antd';
import { DollarOutlined, FileTextOutlined, CarOutlined, UserOutlined } from '@ant-design/icons';
import { dashboardService } from '../services/dashboardService';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="subtitle">Tổng quan hệ thống quản lý bán vé xe buýt</p>

      {stats ? (
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng số vé bán"
                value={stats.totalTickets || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng chuyến xe"
                value={stats.totalTrips || 0}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Tổng doanh thu"
                value={stats.totalRevenue || 0}
                prefix={<DollarOutlined />}
                suffix="VND"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Số khách hàng"
                value={stats.totalPassengers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>
      ) : (
        <Empty description="Không có dữ liệu" />
      )}

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Doanh thu theo tháng" className="chart-card">
            <p>Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Số vé bán theo tuyến đường" className="chart-card">
            <p>Biểu đồ số vé sẽ được hiển thị ở đây</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

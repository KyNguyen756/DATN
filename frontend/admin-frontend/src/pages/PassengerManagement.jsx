import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  message,
  Row,
  Col,
  Empty,
  Statistic,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { passengerService } from '../services/passengerService';
import './Management.css';

export default function PassengerManagement() {
  const [passengers, setPassengers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchPassengers();
    fetchStats();
  }, []);

  const mapUserToPassenger = (u) => ({
    id: u._id,
    fullName: [u.firstName, u.lastName].filter(Boolean).join(' '),
    email: u.email || u.username || '',
    phone: u.phoneNumber || '',
    identityNumber: u.cccd || '',
    address: '',
    ticketCount: 0,
  });

  const fetchPassengers = async () => {
    try {
      setLoading(true);
      const response = await passengerService.getAll();
      setPassengers((response.data || []).map(mapUserToPassenger));
    } catch (error) {
      message.error('Không thể tải danh sách hành khách. Vui lòng đăng nhập.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await passengerService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    if (searchText.trim() === '') {
      fetchPassengers();
      return;
    }
    try {
      setLoading(true);
      const response = await passengerService.search(searchText);
      setPassengers((response.data || []).map(mapUserToPassenger));
    } catch (error) {
      message.error('Tìm kiếm thất bại');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã hành khách',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Số CMND/CCCD',
      dataIndex: 'identityNumber',
      key: 'identityNumber',
      width: 140,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Số vé đã mua',
      dataIndex: 'ticketCount',
      key: 'ticketCount',
      width: 120,
      render: (count) => <strong>{count || 0}</strong>,
    },
  ];

  const filteredPassengers = passengers.filter(
    (passenger) =>
      (passenger.fullName || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (passenger.email || '').includes(searchText) ||
      (passenger.phone || '').includes(searchText) ||
      (passenger.id || '').toString().includes(searchText)
  );

  return (
    <div className="management-page">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="page-header">
            <h1>Quản lý hành khách</h1>
            <Button icon={<ReloadOutlined />} onClick={fetchPassengers} size="large">
              Tải lại
            </Button>
          </div>
        </Col>
      </Row>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng hành khách"
                value={stats.totalPassengers || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Hành khách mới (tháng này)"
                value={stats.newPassengersThisMonth || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Trung bình vé/khách"
                value={(stats.averageTicketPerPassenger || 0).toFixed(1)}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={20}>
            <Input.Search
              placeholder="Tìm kiếm theo tên, email, SĐT hoặc mã hành khách..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              size="large"
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              block
              size="large"
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        {filteredPassengers.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredPassengers}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        ) : (
          <Empty description={searchText ? 'Không tìm thấy hành khách' : 'Không có dữ liệu'} />
        )}
      </Card>
    </div>
  );
}

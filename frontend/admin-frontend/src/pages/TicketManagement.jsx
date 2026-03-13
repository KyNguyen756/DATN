import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  message,
  Space,
  Row,
  Col,
  Input,
  Tag,
} from 'antd';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ticketService } from '../services/ticketService';
import './Management.css';

export default function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getAll();
      const filteredTickets =
        filterStatus === 'all'
          ? response.data
          : response.data.filter((ticket) => ticket.status === filterStatus);
      setTickets(filteredTickets);
    } catch (error) {
      message.error('Không thể tải danh sách vé');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await ticketService.updateStatus(ticketId, newStatus);
      message.success('Cập nhật trạng thái vé thành công');
      fetchTickets();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái vé');
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    const colors = { pending: 'orange', confirmed: 'blue', completed: 'green', cancelled: 'red' };
    const labels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
  };

  const columns = [
    {
      title: 'Mã vé',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id) => (
        <Space size="small">
          <span>{id.slice(0, 8)}</span>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(id);
              message.success('Đã sao chép');
            }}
          />
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'passengerName',
      key: 'passengerName',
      width: 150,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Ghế',
      dataIndex: 'seatNumber',
      key: 'seatNumber',
      width: 80,
    },
    {
      title: 'Tuyến đường',
      dataIndex: 'route',
      key: 'route',
      width: 200,
    },
    {
      title: 'Ngày khởi hành',
      dataIndex: 'departureDate',
      key: 'departureDate',
      width: 130,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => `${price.toLocaleString()} VND`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 140 }}
          onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
          options={[
            { label: 'Chờ xác nhận', value: 'pending' },
            { label: 'Đã xác nhận', value: 'confirmed' },
            { label: 'Hoàn thành', value: 'completed' },
            { label: 'Đã hủy', value: 'cancelled' },
          ]}
        />
      ),
    },
  ];

  const filteredTickets = tickets.filter((ticket) =>
    searchText === ''
      ? true
      : ticket.passengerName.toLowerCase().includes(searchText.toLowerCase()) ||
        ticket.id.includes(searchText) ||
        ticket.phone.includes(searchText)
  );

  return (
    <div className="management-page">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="page-header">
            <h1>Quản lý vé</h1>
            <Button icon={<ReloadOutlined />} onClick={fetchTickets} size="large">
              Tải lại
            </Button>
          </div>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm kiếm theo mã vé, tên hoặc SĐT..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: 'Tất cả', value: 'all' },
                { label: 'Chờ xác nhận', value: 'pending' },
                { label: 'Đã xác nhận', value: 'confirmed' },
                { label: 'Hoàn thành', value: 'completed' },
                { label: 'Đã hủy', value: 'cancelled' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}

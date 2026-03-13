import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { busService } from '../services/busService';
import './Management.css';

export default function BusManagement() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await busService.getAll();
      setBuses(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách xe');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    form.resetFields();
    setIsEditing(false);
    setCurrentBus(null);
    setIsModalVisible(true);
  };

  const handleEditClick = (record) => {
    setIsEditing(true);
    setCurrentBus(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      await busService.delete(id);
      message.success('Xóa xe thành công');
      fetchBuses();
    } catch (error) {
      message.error('Không thể xóa xe');
      console.error(error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing) {
        await busService.update(currentBus.id, values);
        message.success('Cập nhật xe thành công');
      } else {
        await busService.create(values);
        message.success('Thêm xe thành công');
      }
      setIsModalVisible(false);
      fetchBuses();
    } catch (error) {
      message.error('Có lỗi xảy ra');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Biển số xe',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 150,
    },
    {
      title: 'Loại xe',
      dataIndex: 'type',
      key: 'type',
      width: 150,
    },
    {
      title: 'Số ghế',
      dataIndex: 'seats',
      key: 'seats',
      width: 100,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'active' ? '#52c41a' : '#f5222d' }}>
          {status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa xe này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDeleteClick(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="management-page">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="page-header">
            <h1>Quản lý xe</h1>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large">
              Thêm xe mới
            </Button>
          </div>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={buses}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditing ? 'Sửa thông tin xe' : 'Thêm xe mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Biển số xe"
            name="licensePlate"
            rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}
          >
            <Input placeholder="VN ABC 123" />
          </Form.Item>
          <Form.Item
            label="Loại xe"
            name="type"
            rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}
          >
            <Input placeholder="Limousine, Ghế ngồi, Giường nằm..." />
          </Form.Item>
          <Form.Item
            label="Số ghế"
            name="seats"
            rules={[{ required: true, message: 'Vui lòng nhập số ghế' }]}
          >
            <InputNumber min={1} max={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

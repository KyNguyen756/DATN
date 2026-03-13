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
import { routeService } from '../services/routeService';
import './Management.css';

export default function RouteManagement() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeService.getAll();
      setRoutes(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách tuyến đường');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    form.resetFields();
    setIsEditing(false);
    setCurrentRoute(null);
    setIsModalVisible(true);
  };

  const handleEditClick = (record) => {
    setIsEditing(true);
    setCurrentRoute(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      await routeService.delete(id);
      message.success('Xóa tuyến đường thành công');
      fetchRoutes();
    } catch (error) {
      message.error('Không thể xóa tuyến đường');
      console.error(error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing) {
        await routeService.update(currentRoute.id, values);
        message.success('Cập nhật tuyến đường thành công');
      } else {
        await routeService.create(values);
        message.success('Thêm tuyến đường thành công');
      }
      setIsModalVisible(false);
      fetchRoutes();
    } catch (error) {
      message.error('Có lỗi xảy ra');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Điểm đi',
      dataIndex: 'startLocation',
      key: 'startLocation',
      width: 150,
    },
    {
      title: 'Điểm đến',
      dataIndex: 'endLocation',
      key: 'endLocation',
      width: 150,
    },
    {
      title: 'Khoảng cách (km)',
      dataIndex: 'distance',
      key: 'distance',
      width: 100,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
            description="Bạn có chắc chắn muốn xóa tuyến đường này?"
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
            <h1>Quản lý tuyến đường</h1>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large">
              Thêm tuyến mới
            </Button>
          </div>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={routes}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditing ? 'Sửa thông tin tuyến đường' : 'Thêm tuyến đường mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Điểm đi"
            name="startLocation"
            rules={[{ required: true, message: 'Vui lòng nhập điểm đi' }]}
          >
            <Input placeholder="Hà Nội" />
          </Form.Item>
          <Form.Item
            label="Điểm đến"
            name="endLocation"
            rules={[{ required: true, message: 'Vui lòng nhập điểm đến' }]}
          >
            <Input placeholder="Hải Phòng" />
          </Form.Item>
          <Form.Item
            label="Khoảng cách (km)"
            name="distance"
            rules={[{ required: true, message: 'Vui lòng nhập khoảng cách' }]}
          >
            <InputNumber min={0} step={0.1} />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả tuyến đường..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

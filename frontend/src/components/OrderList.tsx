
import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Clock, Loader, Truck, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '@/utils/products.types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type OrderListProps = {
  orders: Order[];
};

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  // Helper to get appropriate icon for status
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'canceled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Helper to get status badge based on order status
  const getStatusBadge = (status: OrderStatus) => {
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (status) {
      case 'delivered':
        badgeVariant = "default";
        break;
      case 'processing':
      case 'shipped':
        badgeVariant = "secondary";
        break;
      case 'canceled':
        badgeVariant = "destructive";
        break;
      case 'pending':
      default:
        badgeVariant = "outline";
    }
    
    return (
      <Badge variant={badgeVariant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  // Sort orders by date (most recent first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || '').getTime();
    const dateB = new Date(b.createdAt || b.created_at || '').getTime();
    return dateB - dateA;
  });

  return (
    <div className="overflow-hidden border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.map((order) => {
            // Handle both camelCase and snake_case formats
            const orderId = order.id;
            const createdDate = order.createdAt || order.created_at || '';
            const formattedDate = createdDate 
              ? format(new Date(createdDate), 'MMM d, yyyy')
              : 'N/A';
              
            return (
              <TableRow key={orderId}>
                <TableCell className="font-medium">
                  {orderId.substring(0, 8)}...
                </TableCell>
                <TableCell>{formattedDate}</TableCell>
                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderList;
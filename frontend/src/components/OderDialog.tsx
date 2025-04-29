
import React from 'react';
import { Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ordersService, productsService } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Loader, Truck, XCircle } from 'lucide-react';
import { OrderStatus } from '@/utils/products.types';

// Helper to get appropriate icon for status (copied from OrderList.tsx)
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

// Helper to get status badge based on order status (copied from OrderList.tsx)
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

import { hydrateOrdersWithProducts } from './hydrateOrderProducts';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Order } from '@/utils/products.types';

const OrdersDialog = () => {
  console.log('[OrdersDialog] component mounted');
  const { data: ordersRaw, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersService.getOrders,
  });
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: productsService.getProducts,
  });
  console.log('[OrdersDialog] products from server:', products);

  const queryClient = useQueryClient();

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      await ordersService.cancelOrder(order.id);
      await Promise.all(
        order.items.map(item => {
          // Defensive: ensure stock and quantity are numbers
          const currentStock = typeof item.product.stock === 'number' ? item.product.stock : 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
          const newStock = currentStock + quantity;
          return productsService.updateProductStock(item.product.id, newStock);
        })
      );
    },
    onSuccess: (data, canceledOrder) => {
      // Optimistically remove canceled order from UI
      setOrders(prev => prev ? prev.filter(order => order.id !== canceledOrder.id) : prev);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  // Hydrate orders with products if needed
  const [orders, setOrders] = React.useState(ordersRaw);
  React.useEffect(() => {
    if (ordersRaw && Array.isArray(products)) {
      setOrders(hydrateOrdersWithProducts(ordersRaw, products));
    } else if (ordersRaw) {
      setOrders(ordersRaw);
    }
  }, [ordersRaw, products]);

  // If React Query error persists, try cleaning node_modules and reinstalling dependencies
  if (productsError) {
    console.error('Error fetching products:', productsError);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Package className="h-5 w-5" />
          {orders && orders.filter(order => order.status !== 'canceled').length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
              {orders.filter(order => order.status !== 'canceled').length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Your Orders</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-4">Loading orders...</div>
        ) : !orders?.length ? (
          <div className="text-center py-4 text-muted-foreground">
            No orders found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.filter(order => order.status !== 'canceled').map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 4)}</TableCell>
                  <TableCell>
                    {order.createdAt && !isNaN(new Date(order.createdAt).getTime())
                      ? format(new Date(order.createdAt), 'MM dd yyyy')
                      : 'N/A'}
                  </TableCell>
                  
                  <TableCell>
                    <ul className="list-disc ml-4">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span style={{ wordBreak: 'break-word', maxWidth: 500, display: 'inline-block', whiteSpace: 'pre-line' }}>
                            {item.product?.name
                              ? item.product.name.replace(/(.{25})/g, '$1\n')
                              : 'Unknown Product'}
                          </span>
                          <span>${item.price} x {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>
  ${order.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0).toFixed(2)}
</TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelOrderMutation.mutate(order)}
                        disabled={cancelOrderMutation.isLoading}
                        style={{ marginLeft: 8 }}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrdersDialog;
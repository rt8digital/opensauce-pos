import type { Order, Product } from '../../../../shared/types';

export function generateDailyReportContent(orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string): string {
  const storeName = settings?.storeName || 'OpenSauce P.O.S.';
  const storeAddress = settings?.storeAddress;
  const storePhone = settings?.storePhone;

  // Calculate comprehensive sales metrics
  let totalSales = 0;
  let totalOrders = orders.length;
  let totalItems = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalDiscounts = 0;
  const paymentMethods: Record<string, { count: number; amount: number }> = {};

  orders.forEach(order => {
    const orderTotal = Number(order.total);
    totalSales += orderTotal;

    // Parse items and calculate additional metrics
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    items.forEach((item: any) => {
      totalItems += item.quantity;
      // Calculate cost based on product cost if available
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      totalCost += itemCost * item.quantity;
    });

    // Calculate profit
    totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      return sum + (itemCost * item.quantity);
    }, 0));

    // Calculate discounts (if available in order data)
    if (order.discount) {
      totalDiscounts += Number(order.discount);
    }

    // Track payment methods
    const method = order.paymentMethod || 'Unknown';
    if (!paymentMethods[method]) {
      paymentMethods[method] = { count: 0, amount: 0 };
    }
    paymentMethods[method].count++;
    paymentMethods[method].amount += orderTotal;
  });

  let content = `
    <div class="header">
      <div class="store-name">${storeName}</div>
      <div class="report-title">Daily Sales Report</div>
      <div class="date-range">
        ${new Date().toLocaleDateString()}
      </div>
      ${storeAddress ? `<div>${storeAddress}</div>` : ''}
      ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
    </div>
  `;

  content += `
    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Total Sales</div>
        <div class="summary-value">${formatPrice(totalSales)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Orders</div>
        <div class="summary-value">${totalOrders}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Average Order Value</div>
        <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Items Sold</div>
        <div class="summary-value">${totalItems}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Cost</div>
        <div class="summary-value">${formatPrice(totalCost)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Profit</div>
        <div class="summary-value">${formatPrice(totalProfit)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Discounts</div>
        <div class="summary-value">${formatPrice(totalDiscounts)}</div>
      </div>
    </div>
  `;

  // Add sales by payment method
  content += `
    <div class="section">
      <div class="section-title">Sales by Payment Method</div>
      <table>
        <thead>
          <tr>
            <th>Payment Method</th>
            <th class="amount">Count</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.entries(paymentMethods).forEach(([method, data]) => {
    content += `
      <tr>
        <td>${method}</td>
        <td class="amount">${data.count}</td>
        <td class="amount">${formatPrice(data.amount)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of orders (without detailed items) - This is already a summary
  content += `
    <div class="section">
      <div class="section-title">Order Summary</div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Time</th>
            <th>Payment Method</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  orders.forEach(order => {
    content += `
      <tr>
        <td>#${order.id}</td>
        <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
        <td>${order.paymentMethod}</td>
        <td class="amount">${formatPrice(Number(order.total))}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of top selling products
  content += `
    <div class="section">
      <div class="section-title">Top Selling Products</div>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th class="amount">Quantity Sold</th>
            <th class="amount">Revenue</th>
            <th class="amount">Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Aggregate all items sold across all orders
  const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
  orders.forEach(order => {
    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
    orderItems.forEach((item: any) => {
      const key = `${item.productId}-${item.productName}`;
      if (!allItemsSold[key]) {
        allItemsSold[key] = {
          name: item.productName || 'Item',
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      allItemsSold[key].totalQuantity += item.quantity;
      allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;

      // Calculate profit for this item
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      const itemProfit = (Number(item.price) - itemCost) * item.quantity;
      allItemsSold[key].totalProfit += itemProfit;
    });
  });

  // Sort items by quantity sold (descending)
  const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);

  sortedItems.forEach(([key, item]) => {
    content += `
      <tr>
        <td>${item.name}</td>
        <td class="amount">${item.totalQuantity}</td>
        <td class="amount">${formatPrice(item.totalRevenue)}</td>
        <td class="amount">${formatPrice(item.totalProfit)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  return content;
}

export function generateWeeklyReportContent(orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string): string {
  const storeName = settings?.storeName || 'OpenSauce P.O.S.';
  const storeAddress = settings?.storeAddress;
  const storePhone = settings?.storePhone;

  // Calculate appropriate date range for the report
  // If we have orders, use the min and max dates from the orders
  let reportStartDate, reportEndDate;
  if (orders.length > 0) {
    const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
    reportStartDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
    reportEndDate = new Date(Math.max(...orderDates.map(date => date.getTime())));
  } else {
    // Fallback to current week if no orders
    const now = new Date();
    const dayOfWeek = now.getDay();
    reportStartDate = new Date(now);
    reportStartDate.setDate(now.getDate() - dayOfWeek);
    reportEndDate = new Date(reportStartDate);
    reportEndDate.setDate(reportStartDate.getDate() + 6);
  }

  // Calculate comprehensive sales metrics
  let totalSales = 0;
  let totalOrders = orders.length;
  let totalItems = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalDiscounts = 0;
  const paymentMethods: Record<string, { count: number; amount: number }> = {};

  orders.forEach(order => {
    const orderTotal = Number(order.total);
    totalSales += orderTotal;

    // Parse items and calculate additional metrics
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    items.forEach((item: any) => {
      totalItems += item.quantity;
      // Calculate cost based on product cost if available
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      totalCost += itemCost * item.quantity;
    });

    // Calculate profit
    totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      return sum + (itemCost * item.quantity);
    }, 0));

    // Calculate discounts (if available in order data)
    if (order.discount) {
      totalDiscounts += Number(order.discount);
    }

    // Track payment methods
    const method = order.paymentMethod || 'Unknown';
    if (!paymentMethods[method]) {
      paymentMethods[method] = { count: 0, amount: 0 };
    }
    paymentMethods[method].count++;
    paymentMethods[method].amount += orderTotal;
  });

  let content = `
    <div class="header">
      <div class="store-name">${storeName}</div>
      <div class="report-title">Weekly Sales Report</div>
      <div class="date-range">
        ${reportStartDate.toLocaleDateString()} - ${reportEndDate.toLocaleDateString()}
      </div>
      ${storeAddress ? `<div>${storeAddress}</div>` : ''}
      ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
    </div>
  `;

  content += `
    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Total Sales</div>
        <div class="summary-value">${formatPrice(totalSales)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Orders</div>
        <div class="summary-value">${totalOrders}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Average Order Value</div>
        <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Items Sold</div>
        <div class="summary-value">${totalItems}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Cost</div>
        <div class="summary-value">${formatPrice(totalCost)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Profit</div>
        <div class="summary-value">${formatPrice(totalProfit)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Discounts</div>
        <div class="summary-value">${formatPrice(totalDiscounts)}</div>
      </div>
    </div>
  `;

  // Add sales by payment method
  content += `
    <div class="section">
      <div class="section-title">Sales by Payment Method</div>
      <table>
        <thead>
          <tr>
            <th>Payment Method</th>
            <th class="amount">Count</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.entries(paymentMethods).forEach(([method, data]) => {
    content += `
      <tr>
        <td>${method}</td>
        <td class="amount">${data.count}</td>
        <td class="amount">${formatPrice(data.amount)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add daily breakdown
  content += `
    <div class="section">
      <div class="section-title">Daily Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th class="amount">Orders</th>
            <th class="amount">Sales Amount</th>
            <th class="amount">Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Create a map of daily sales
  const dailySales: Record<string, { orders: number; amount: number; profit: number }> = {};

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt || new Date());
    const dateStr = orderDate.toISOString().split('T')[0];
    if (!dailySales[dateStr]) {
      dailySales[dateStr] = { orders: 0, amount: 0, profit: 0 };
    }
    dailySales[dateStr].orders++;
    dailySales[dateStr].amount += Number(order.total);

    // Calculate profit for this order
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const orderProfit = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      return sum + (Number(item.price) - itemCost) * item.quantity;
    }, 0);
    dailySales[dateStr].profit += orderProfit;
  });

  // Sort the dates for the report
  const sortedDates = Object.keys(dailySales).sort();

  sortedDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    content += `
      <tr>
        <td>${daysOfWeek[date.getDay()]} (${date.toLocaleDateString()})</td>
        <td class="amount">${dailySales[dateStr].orders}</td>
        <td class="amount">${formatPrice(dailySales[dateStr].amount)}</td>
        <td class="amount">${formatPrice(dailySales[dateStr].profit)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of orders (without detailed items)
  content += `
    <div class="section">
      <div class="section-title">Order Summary</div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Time</th>
            <th>Payment Method</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  orders.forEach(order => {
    content += `
      <tr>
        <td>#${order.id}</td>
        <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
        <td>${order.paymentMethod}</td>
        <td class="amount">${formatPrice(Number(order.total))}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of top selling products
  content += `
    <div class="section">
      <div class="section-title">Top Selling Products</div>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th class="amount">Quantity Sold</th>
            <th class="amount">Revenue</th>
            <th class="amount">Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Aggregate all items sold across all orders
  const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
  orders.forEach(order => {
    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
    orderItems.forEach((item: any) => {
      const key = `${item.productId}-${item.productName}`;
      if (!allItemsSold[key]) {
        allItemsSold[key] = {
          name: item.productName || 'Item',
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      allItemsSold[key].totalQuantity += item.quantity;
      allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;

      // Calculate profit for this item
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      const itemProfit = (Number(item.price) - itemCost) * item.quantity;
      allItemsSold[key].totalProfit += itemProfit;
    });
  });

  // Sort items by quantity sold (descending)
  const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);

  sortedItems.forEach(([key, item]) => {
    content += `
      <tr>
        <td>${item.name}</td>
        <td class="amount">${item.totalQuantity}</td>
        <td class="amount">${formatPrice(item.totalRevenue)}</td>
        <td class="amount">${formatPrice(item.totalProfit)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  return content;
}

export function generateMonthlyReportContent(orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string): string {
  const storeName = settings?.storeName || 'OpenSauce P.O.S.';
  const storeAddress = settings?.storeAddress;
  const storePhone = settings?.storePhone;

  // Calculate appropriate date range for the report
  // If we have orders, use the min and max dates from the orders
  let reportStartMonth, reportEndMonth;
  if (orders.length > 0) {
    const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
    const minDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...orderDates.map(date => date.getTime())));

    // Set to beginning of month for start, end of month for end
    reportStartMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    reportEndMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
  } else {
    // Fallback to current month if no orders
    const now = new Date();
    reportStartMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    reportEndMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // Calculate comprehensive sales metrics
  let totalSales = 0;
  let totalOrders = orders.length;
  let totalItems = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalDiscounts = 0;
  const paymentMethods: Record<string, { count: number; amount: number }> = {};

  orders.forEach(order => {
    const orderTotal = Number(order.total);
    totalSales += orderTotal;

    // Parse items and calculate additional metrics
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    items.forEach((item: any) => {
      totalItems += item.quantity;
      // Calculate cost based on product cost if available
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      totalCost += itemCost * item.quantity;
    });

    // Calculate profit
    totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      return sum + (itemCost * item.quantity);
    }, 0));

    // Calculate discounts (if available in order data)
    if (order.discount) {
      totalDiscounts += Number(order.discount);
    }

    // Track payment methods
    const method = order.paymentMethod || 'Unknown';
    if (!paymentMethods[method]) {
      paymentMethods[method] = { count: 0, amount: 0 };
    }
    paymentMethods[method].count++;
    paymentMethods[method].amount += orderTotal;
  });

  let content = `
    <div class="header">
      <div class="store-name">${storeName}</div>
      <div class="report-title">Monthly Sales Report</div>
      <div class="date-range">
        ${reportStartMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
      </div>
      ${storeAddress ? `<div>${storeAddress}</div>` : ''}
      ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
    </div>
  `;

  content += `
    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Total Sales</div>
        <div class="summary-value">${formatPrice(totalSales)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Orders</div>
        <div class="summary-value">${totalOrders}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Average Order Value</div>
        <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Items Sold</div>
        <div class="summary-value">${totalItems}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Cost</div>
        <div class="summary-value">${formatPrice(totalCost)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Profit</div>
        <div class="summary-value">${formatPrice(totalProfit)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Discounts</div>
        <div class="summary-value">${formatPrice(totalDiscounts)}</div>
      </div>
    </div>
  `;

  // Add sales by payment method
  content += `
    <div class="section">
      <div class="section-title">Sales by Payment Method</div>
      <table>
        <thead>
          <tr>
            <th>Payment Method</th>
            <th class="amount">Count</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.entries(paymentMethods).forEach(([method, data]) => {
    content += `
      <tr>
        <td>${method}</td>
        <td class="amount">${data.count}</td>
        <td class="amount">${formatPrice(data.amount)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add weekly breakdown
  content += `
    <div class="section">
      <div class="section-title">Weekly Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th class="amount">Orders</th>
            <th class="amount">Sales Amount</th>
            <th class="amount">Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Create a map of weekly sales
  const weeklySales: Record<string, { orders: number; amount: number; profit: number }> = {};

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt || new Date());
    // Find which week this order belongs to
    const weekStart = new Date(orderDate);
    weekStart.setDate(orderDate.getDate() - orderDate.getDay()); // Start on Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End on Saturday

    const weekKey = `${weekStart.toISOString().split('T')[0]}_to_${weekEnd.toISOString().split('T')[0]}`;
    if (!weeklySales[weekKey]) {
      weeklySales[weekKey] = { orders: 0, amount: 0, profit: 0 };
    }
    weeklySales[weekKey].orders++;
    weeklySales[weekKey].amount += Number(order.total);

    // Calculate profit for this order
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const orderProfit = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      return sum + (Number(item.price) - itemCost) * item.quantity;
    }, 0);
    weeklySales[weekKey].profit += orderProfit;
  });

  // Sort the weeks for the report
  const sortedWeeks = Object.keys(weeklySales).sort();

  sortedWeeks.forEach(weekKey => {
    const [startStr, endStr] = weekKey.split('_to_');
    const start = new Date(startStr);
    const end = new Date(endStr);

    content += `
      <tr>
        <td>${start.toLocaleDateString()} - ${end.toLocaleDateString()}</td>
        <td class="amount">${weeklySales[weekKey].orders}</td>
        <td class="amount">${formatPrice(weeklySales[weekKey].amount)}</td>
        <td class="amount">${formatPrice(weeklySales[weekKey].profit)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of orders (without detailed items)
  content += `
    <div class="section">
      <div class="section-title">Order Summary</div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Time</th>
            <th>Payment Method</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  orders.forEach(order => {
    content += `
      <tr>
        <td>#${order.id}</td>
        <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
        <td>${order.paymentMethod}</td>
        <td class="amount">${formatPrice(Number(order.total))}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of top selling products
  content += `
    <div class="section">
      <div class="section-title">Top Selling Products</div>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th class="amount">Quantity Sold</th>
            <th class="amount">Revenue</th>
            <th class="amount">Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Aggregate all items sold across all orders
  const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
  orders.forEach(order => {
    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
    orderItems.forEach((item: any) => {
      const key = `${item.productId}-${item.productName}`;
      if (!allItemsSold[key]) {
        allItemsSold[key] = {
          name: item.productName || 'Item',
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      allItemsSold[key].totalQuantity += item.quantity;
      allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;

      // Calculate profit for this item
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      const itemProfit = (Number(item.price) - itemCost) * item.quantity;
      allItemsSold[key].totalProfit += itemProfit;
    });
  });

  // Sort items by quantity sold (descending)
  const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);

  sortedItems.forEach(([key, item]) => {
    content += `
      <tr>
        <td>${item.name}</td>
        <td class="amount">${item.totalQuantity}</td>
        <td class="amount">${formatPrice(item.totalRevenue)}</td>
        <td class="amount">${formatPrice(item.totalProfit)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  return content;
}

export function generateYearlyReportContent(orders: Order[], settings: any, products: Product[], formatPrice: (price: number) => string): string {
  const storeName = settings?.storeName || 'OpenSauce P.O.S.';
  const storeAddress = settings?.storeAddress;
  const storePhone = settings?.storePhone;

  // Calculate appropriate date range for the report
  // If we have orders, use the min and max dates from the orders
  let reportStartYear, reportEndYear;
  if (orders.length > 0) {
    const orderDates = orders.map(order => new Date(order.createdAt || new Date()));
    const minDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
    const maxDate = new Date(Math.max(...orderDates.map(date => date.getTime())));

    // Set to beginning of year for start, end of year for end
    reportStartYear = new Date(minDate.getFullYear(), 0, 1); // January 1st
    reportEndYear = new Date(maxDate.getFullYear(), 11, 31); // December 31st
  } else {
    // Fallback to current year if no orders
    const now = new Date();
    reportStartYear = new Date(now.getFullYear(), 0, 1); // January 1st
    reportEndYear = new Date(now.getFullYear(), 11, 31); // December 31st
  }

  // Calculate comprehensive sales metrics
  let totalSales = 0;
  let totalOrders = orders.length;
  let totalItems = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalDiscounts = 0;
  const paymentMethods: Record<string, { count: number; amount: number }> = {};

  orders.forEach(order => {
    const orderTotal = Number(order.total);
    totalSales += orderTotal;

    // Parse items and calculate additional metrics
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    items.forEach((item: any) => {
      totalItems += item.quantity;
      // Calculate cost based on product cost if available
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      totalCost += itemCost * item.quantity;
    });

    // Calculate profit
    totalProfit += (orderTotal - items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      return sum + (itemCost * item.quantity);
    }, 0));

    // Calculate discounts (if available in order data)
    if (order.discount) {
      totalDiscounts += Number(order.discount);
    }

    // Track payment methods
    const method = order.paymentMethod || 'Unknown';
    if (!paymentMethods[method]) {
      paymentMethods[method] = { count: 0, amount: 0 };
    }
    paymentMethods[method].count++;
    paymentMethods[method].amount += orderTotal;
  });

  let content = `
    <div class="header">
      <div class="store-name">${storeName}</div>
      <div class="report-title">Yearly Sales Report</div>
      <div class="date-range">
        ${reportStartYear.getFullYear()} - ${reportEndYear.getFullYear()}
      </div>
      ${storeAddress ? `<div>${storeAddress}</div>` : ''}
      ${storePhone ? `<div>Tel: ${storePhone}</div>` : ''}
    </div>
  `;

  content += `
    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Total Sales</div>
        <div class="summary-value">${formatPrice(totalSales)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Orders</div>
        <div class="summary-value">${totalOrders}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Average Order Value</div>
        <div class="summary-value">${totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Items Sold</div>
        <div class="summary-value">${totalItems}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Cost</div>
        <div class="summary-value">${formatPrice(totalCost)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Profit</div>
        <div class="summary-value">${formatPrice(totalProfit)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Discounts</div>
        <div class="summary-value">${formatPrice(totalDiscounts)}</div>
      </div>
    </div>
  `;

  // Add sales by payment method
  content += `
    <div class="section">
      <div class="section-title">Sales by Payment Method</div>
      <table>
        <thead>
          <tr>
            <th>Payment Method</th>
            <th class="amount">Count</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
  `;

  Object.entries(paymentMethods).forEach(([method, data]) => {
    content += `
      <tr>
        <td>${method}</td>
        <td class="amount">${data.count}</td>
        <td class="amount">${formatPrice(data.amount)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add monthly breakdown
  content += `
    <div class="section">
      <div class="section-title">Monthly Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th class="amount">Orders</th>
            <th class="amount">Sales Amount</th>
            <th class="amount">Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Create a map of monthly sales
  const monthlySales: Record<string, { orders: number; amount: number; profit: number }> = {};

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt || new Date());
    const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;

    if (!monthlySales[monthKey]) {
      monthlySales[monthKey] = { orders: 0, amount: 0, profit: 0 };
    }
    monthlySales[monthKey].orders++;
    monthlySales[monthKey].amount += Number(order.total);

    // Calculate profit for this order
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const orderProfit = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      return sum + (Number(item.price) - itemCost) * item.quantity;
    }, 0);
    monthlySales[monthKey].profit += orderProfit;
  });

  // Sort the months for the report
  const sortedMonths = Object.keys(monthlySales).sort();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  sortedMonths.forEach(monthKey => {
    const [year, monthIndex] = monthKey.split('-').map(Number);
    content += `
      <tr>
        <td>${monthNames[monthIndex]} ${year}</td>
        <td class="amount">${monthlySales[monthKey].orders}</td>
        <td class="amount">${formatPrice(monthlySales[monthKey].amount)}</td>
        <td class="amount">${formatPrice(monthlySales[monthKey].profit)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of orders (without detailed items)
  content += `
    <div class="section">
      <div class="section-title">Order Summary</div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Time</th>
            <th>Payment Method</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  orders.forEach(order => {
    content += `
      <tr>
        <td>#${order.id}</td>
        <td>${new Date(order.createdAt || new Date()).toLocaleTimeString()}</td>
        <td>${order.paymentMethod}</td>
        <td class="amount">${formatPrice(Number(order.total))}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  // Add summary of top selling products
  content += `
    <div class="section">
      <div class="section-title">Top Selling Products</div>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th class="amount">Quantity Sold</th>
            <th class="amount">Revenue</th>
            <th class="amount">Profit</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Aggregate all items sold across all orders
  const allItemsSold: Record<string, { name: string, totalQuantity: number, totalRevenue: number, totalProfit: number }> = {};
  orders.forEach(order => {
    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) as any[] : order.items as any[];
    orderItems.forEach((item: any) => {
      const key = `${item.productId}-${item.productName}`;
      if (!allItemsSold[key]) {
        allItemsSold[key] = {
          name: item.productName || 'Item',
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      allItemsSold[key].totalQuantity += item.quantity;
      allItemsSold[key].totalRevenue += Number(item.price) * item.quantity;

      // Calculate profit for this item
      const product = products.find(p => p.id === item.productId);
      const itemCost = Number(product?.cost || 0);
      const itemProfit = (Number(item.price) - itemCost) * item.quantity;
      allItemsSold[key].totalProfit += itemProfit;
    });
  });

  // Sort items by quantity sold (descending)
  const sortedItems = Object.entries(allItemsSold).sort((a, b) => b[1].totalQuantity - a[1].totalQuantity);

  sortedItems.forEach(([key, item]) => {
    content += `
      <tr>
        <td>${item.name}</td>
        <td class="amount">${item.totalQuantity}</td>
        <td class="amount">${formatPrice(item.totalRevenue)}</td>
        <td class="amount">${formatPrice(item.totalProfit)}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>
    </div>
  `;

  return content;
}
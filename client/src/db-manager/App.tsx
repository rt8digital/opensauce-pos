import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Edit, Search } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TableData {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function DatabaseManager() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch available tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await apiRequest('GET', '/api/db/tables');
        const data = await response.json();
        setTables(data);
        if (data.length > 0) {
          setSelectedTable(data[0]);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };

    fetchTables();
  }, []);

  // Fetch table data when selected table changes
  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', `/api/db/${tableName}`);
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error(`Error fetching ${tableName} data:`, error);
      setTableData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedTable) return;
    
    if (window.confirm(`Are you sure you want to delete this record?`)) {
      try {
        await apiRequest('DELETE', `/api/db/${selectedTable}/${id}`);
        // Refresh the data
        fetchTableData(selectedTable);
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
  };

  // Render table data as a simple grid
  const renderTableData = () => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!tableData || !tableData.data.length) {
      return <div>No data available</div>;
    }

    // Get all unique column names
    const allKeys = new Set<string>();
    tableData.data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });

    const columns = Array.from(allKeys);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {columns.map(column => (
                <th key={column} className="text-left p-2 font-semibold">
                  {column}
                </th>
              ))}
              <th className="text-left p-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-muted">
                {columns.map(column => (
                  <td key={column} className="p-2">
                    {typeof row[column] === 'object' 
                      ? JSON.stringify(row[column]) 
                      : String(row[column] ?? '')}
                  </td>
                ))}
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => 'id' in row && handleDelete(row.id)}
                      disabled={!('id' in row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar className="w-64 bg-white border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Database Tables</SidebarGroupLabel>
            <SidebarMenu>
              {tables.map(table => (
                <SidebarMenuItem key={table}>
                  <SidebarMenuButton
                    isActive={selectedTable === table}
                    onClick={() => handleTableSelect(table)}
                  >
                    {table}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Database Manager</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTable ? `${selectedTable.charAt(0).toUpperCase() + selectedTable.slice(1)} Table` : 'Select a Table'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTable ? renderTableData() : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a table from the sidebar to view its data
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
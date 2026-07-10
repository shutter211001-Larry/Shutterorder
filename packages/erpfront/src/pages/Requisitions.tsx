import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { PackageOpen, CheckCircle, Truck, PackageCheck, AlertCircle } from "lucide-react";

export default function Requisitions() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      const res = await api.get<{ data: any[] }>("/requisitions");
      setRequisitions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (id: string) => {
    if (!confirm("確定要出貨此叫貨單嗎？這將扣除總倉庫存。")) return;
    try {
      await api.post(`/requisitions/${id}/ship`, {});
      fetchRequisitions();
    } catch (err: any) {
      alert("出貨失敗：" + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-white">分店叫貨管理</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-sm">
                <th className="p-4 font-bold">叫貨單號</th>
                <th className="p-4 font-bold">分店</th>
                <th className="p-4 font-bold">日期</th>
                <th className="p-4 font-bold">狀態</th>
                <th className="p-4 font-bold">品項數量</th>
                <th className="p-4 font-bold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {requisitions.map((req) => (
                <tr key={req.id} className="text-slate-300">
                  <td className="p-4 font-mono text-xs">{req.id.slice(-8)}</td>
                  <td className="p-4">{req.location?.name}</td>
                  <td className="p-4">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    {req.status === "PENDING" && <span className="text-yellow-400">待處理</span>}
                    {req.status === "SHIPPED" && <span className="text-blue-400">已出貨</span>}
                    {req.status === "RECEIVED" && <span className="text-green-400">已收貨</span>}
                  </td>
                  <td className="p-4">{req.items?.length || 0} 項</td>
                  <td className="p-4">
                    {req.status === "PENDING" && (
                      <button
                        onClick={() => handleShip(req.id)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                      >
                        <Truck size={16} /> 出貨
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {requisitions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <PackageOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p>尚無叫貨單</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

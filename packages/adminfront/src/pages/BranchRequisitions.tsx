import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Truck, Plus, PackageCheck, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function BranchRequisitions() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const locationId = "cm5nv3t9v000108mh35f4c5vw"; // For demo purposes, we will use a dummy or fetched locationId
  // Wait, in adminfront, they usually get locationId from the URL or global context?
  // I will just use a hardcoded fallback or fetch the first location.

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get branch locations
      const locRes = await api.get<{ data: any[] }>("/locations");
      const locId = locRes.data?.[0]?.id;
      
      if (!locId) {
        setLoading(false);
        return;
      }

      const [reqRes, invRes] = await Promise.all([
        api.get<any[]>(`/requisitions?locationId=${locId}`),
        api.get<any[]>(`/requisitions/inventory?locationId=${locId}`)
      ]);
      setRequisitions(reqRes);
      setInventory(invRes);
    } catch (err) {
      console.error(err);
      toast.error("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (id: string) => {
    if (!confirm("確定要收貨嗎？這將會更新門市庫存！")) return;
    try {
      await api.post(`/requisitions/${id}/receive`, {});
      toast.success("收貨成功，庫存已更新");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "收貨失敗");
    }
  };

  if (loading) return <div>載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-800">門市叫貨管理</h1>
          <p className="text-gray-500 mt-2">向中央廚房發起叫貨單，並追蹤出貨進度</p>
        </div>
        <button
          onClick={() => toast("此功能示範中（暫未實作新增叫貨表單）")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> 新增叫貨單
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-4">歷史叫貨紀錄</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="p-4 font-bold rounded-l-xl">單號</th>
                <th className="p-4 font-bold">日期</th>
                <th className="p-4 font-bold">狀態</th>
                <th className="p-4 font-bold rounded-r-xl">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requisitions.map((req) => (
                <tr key={req.id}>
                  <td className="p-4 font-mono text-sm">{req.id.slice(-8)}</td>
                  <td className="p-4">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    {req.status === "PENDING" && <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-xs font-bold">待總部審核</span>}
                    {req.status === "SHIPPED" && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold">總部已出貨</span>}
                    {req.status === "RECEIVED" && <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold">已收貨入庫</span>}
                  </td>
                  <td className="p-4">
                    {req.status === "SHIPPED" && (
                      <button
                        onClick={() => handleReceive(req.id)}
                        className="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
                      >
                        確認收貨
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {requisitions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    <Truck size={48} className="mx-auto mb-4 opacity-20" />
                    目前沒有叫貨紀錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">門市現有庫存</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {inventory.map((inv) => (
            <div key={inv.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50 flex flex-col items-center text-center">
              <PackageCheck className="text-gray-400 mb-2" size={32} />
              <span className="font-bold text-gray-800">{inv.ingredient.name}</span>
              <span className="text-lg font-black text-blue-600 mt-1">
                {inv.currentStock} {inv.ingredient.unit}
              </span>
            </div>
          ))}
          {inventory.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-400">
              分店庫存目前為空，請發起叫貨以補足庫存。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

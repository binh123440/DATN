// import { useState, useEffect } from 'react';
// import { Plus, X, Upload, Calendar, User } from 'lucide-react';
// import { capNhatKeHoachSuKien, layDanhSachNguoiPhanCong } from '../services/apiService';

// const EventPlanForm = ({ eventId, initialPlan, onSave, onCancel }) => {
//   const [tasks, setTasks] = useState(initialPlan?.tasks || []);
//   const [targetAudience, setTargetAudience] = useState(initialPlan?.target_audience || {});
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const response = await layDanhSachNguoiPhanCong('all');
//       if (response.success) setUsers(response.data);
//     } catch (error) {
//       console.error('Lỗi tải danh sách người dùng:', error);
//     }
//   };

//   const addTask = () => {
//     setTasks([...tasks, {
//       id: `t${Date.now()}`,
//       title: '',
//       description: '',
//       order: tasks.length + 1,
//       assignee: null,
//       deadline: '',
//       attachments: [],
//       status: 'todo'
//     }]);
//   };

//   const updateTask = (index, field, value) => {
//     const newTasks = [...tasks];
//     newTasks[index][field] = value;
//     setTasks(newTasks);
//   };

//   const removeTask = (index) => {
//     setTasks(tasks.filter((_, i) => i !== index));
//   };

//   const handleSave = async () => {
//     setLoading(true);
//     try {
//       const keHoach = { tasks, target_audience: targetAudience };
//       const response = await capNhatKeHoachSuKien(eventId, keHoach);
//       if (response.success) {
//         alert('✅ Lưu kế hoạch thành công!');
//         onSave?.();
//       }
//     } catch (error) {
//       alert('❌ Lỗi: ' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6">
//       <h2 className="text-xl font-bold mb-4">📋 Kế hoạch chi tiết</h2>

//       {/* Danh sách công việc */}
//       <div className="space-y-4 mb-6">
//         <div className="flex items-center justify-between">
//           <h3 className="font-semibold">Danh sách công việc</h3>
//           <button
//             onClick={addTask}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//           >
//             <Plus size={18} />
//             Thêm công việc
//           </button>
//         </div>

//         {tasks.map((task, index) => (
//           <div key={task.id} className="border border-gray-200 rounded-lg p-4">
//             <div className="flex items-start justify-between mb-3">
//               <input
//                 type="text"
//                 placeholder="Tên công việc"
//                 value={task.title}
//                 onChange={(e) => updateTask(index, 'title', e.target.value)}
//                 className="flex-1 text-lg font-semibold border-0 focus:ring-0 p-0"
//               />
//               <button
//                 onClick={() => removeTask(index)}
//                 className="text-red-500 hover:text-red-700"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <textarea
//               placeholder="Mô tả công việc..."
//               value={task.description}
//               onChange={(e) => updateTask(index, 'description', e.target.value)}
//               className="w-full border border-gray-300 rounded-lg p-2 mb-3"
//               rows="2"
//             />

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   <User size={16} className="inline mr-1" />
//                   Giao cho
//                 </label>
//                 <select
//                   value={task.assignee?.id || ''}
//                   onChange={(e) => {
//                     const user = users.find(u => u.id === parseInt(e.target.value));
//                     updateTask(index, 'assignee', user ? {
//                       type: 'user',
//                       id: user.id,
//                       name: user.ho_ten,
//                       email: user.email
//                     } : null);
//                   }}
//                   className="w-full border border-gray-300 rounded-lg p-2"
//                 >
//                   <option value="">-- Chọn người thực hiện --</option>
//                   {users.map(user => (
//                     <option key={user.id} value={user.id}>
//                       {user.ho_ten} ({user.vai_tro})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   <Calendar size={16} className="inline mr-1" />
//                   Deadline
//                 </label>
//                 <input
//                   type="datetime-local"
//                   value={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''}
//                   onChange={(e) => updateTask(index, 'deadline', new Date(e.target.value).toISOString())}
//                   className="w-full border border-gray-300 rounded-lg p-2"
//                 />
//               </div>
//             </div>

//             {task.assignee && (
//               <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm">
//                 👤 <strong>{task.assignee.name}</strong> sẽ nhận thông báo qua email
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Đối tượng tham gia */}
//       <div className="border-t pt-6">
//         <h3 className="font-semibold mb-3">🎯 Đối tượng tham gia</h3>
//         <div className="space-y-3">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={targetAudience.voluntary || false}
//               onChange={(e) => setTargetAudience({ ...targetAudience, voluntary: e.target.checked })}
//               className="rounded"
//             />
//             <span>Đăng ký tự nguyện (không bắt buộc)</span>
//           </label>

//           {!targetAudience.voluntary && (
//             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//               <p className="text-sm text-yellow-800">
//                 ⚠️ Chế độ bắt buộc: Sinh viên được chỉ định sẽ nhận thông báo yêu cầu tham gia
//               </p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="flex gap-3 mt-6">
//         <button
//           onClick={handleSave}
//           disabled={loading}
//           className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
//         >
//           {loading ? 'Đang lưu...' : '💾 Lưu kế hoạch'}
//         </button>
//         <button
//           onClick={onCancel}
//           className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
//         >
//           Hủy
//         </button>
//       </div>
//     </div>
//   );
// };

// export default EventPlanForm;
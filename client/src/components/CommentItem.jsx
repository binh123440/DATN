import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

const CommentItem = ({ comment, currentUserId, onEdit, onDelete, onReply, depth = 0 }) => {
  const [showActions, setShowActions] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  
  const isOwner = currentUserId === comment.id_tac_gia;
  const hasReplies = comment.binh_luan_tra_loi && comment.binh_luan_tra_loi.length > 0;
  const maxIndent = 4;
  const currentIndent = Math.min(depth, maxIndent);
  const indentClass = currentIndent > 0 ? `ml-${currentIndent * 4}` : '';

  const initials = comment.tac_gia.ho_ten
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`mb-3 ${indentClass}`}>
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {initials}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block max-w-full">
            <div className="flex items-center justify-between mb-1">
              <h5 className="font-semibold text-sm text-gray-900">{comment.tac_gia.ho_ten}</h5>
              {isOwner && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                      <button
                        onClick={() => {
                          onEdit(comment);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit2 size={14} />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment.id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-800 break-words">{comment.noi_dung}</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-1 ml-2 text-xs text-gray-500">
            <span>{new Date(comment.ngay_tao).toLocaleString('vi-VN')}</span>
            <button
              onClick={() => onReply(comment)}
              className="hover:text-blue-600 font-medium transition-colors"
            >
              Trả lời
            </button>
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="hover:text-blue-600 font-medium transition-colors flex items-center space-x-1"
              >
                <span>{showReplies ? '▼' : '►'}</span>
                <span>{comment.binh_luan_tra_loi.length} phản hồi</span>
              </button>
            )}
          </div>

          {hasReplies && showReplies && (
            <div className={`mt-2 space-y-2 ${depth < maxIndent ? 'border-l-2 border-blue-100 pl-3' : ''}`}>
              {comment.binh_luan_tra_loi.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
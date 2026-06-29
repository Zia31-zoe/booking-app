import React, { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  CalendarPlus,
  Users,
  Plus,
  LogOut,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Star,
  Clock,
  CalendarDays,
  ShoppingCart,
  Wallet,
  Phone,
  MapPin,
  Bell,
  Camera,
  Upload,
  Trash2,
  ArrowRightCircle,
  Pencil,
  CheckCircle2,
} from "lucide-react";

/* ============================================================
   Supabase 設定
   ============================================================ */
const SUPABASE_URL = "https://aqfdtgqhpnkffxfrefjl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZmR0Z3FocG5rZmZ4ZnJlZmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjgzNTIsImV4cCI6MjA5NzAwNDM1Mn0.DA76K7fr6k5H8l1IRULrejBy2x7nVDM3Xb9GAcv4Cv0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const FILES_BUCKET = "member-files";

/* ============================================================
   共用工具
   ============================================================ */
const pad2 = (n) => String(n).padStart(2, "0");

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const dateStrAdd = (dateStr, days) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
};

const fmtMoney = (n) => `$${Number(n || 0).toLocaleString()}`;

// 兩個日期字串(YYYY-MM-DD)的天數差
const daysBetween = (fromDateStr, toDateStr) => {
  const a = new Date(fromDateStr + "T00:00:00");
  const b = new Date(toDateStr + "T00:00:00");
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
};

const TAB_CONFIG = [
  { key: "overview", label: "總覽", icon: LayoutDashboard },
  { key: "calendar", label: "行事曆", icon: CalendarDays },
  { key: "members", label: "學員管理", icon: Users },
  { key: "schedule", label: "排課管理", icon: CalendarPlus },
  { key: "cashflow", label: "金流", icon: Wallet },
];

/* ============================================================
   Auth 畫面
   ============================================================ */
function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("coach");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: name || email.split("@")[0],
            role,
          });
        }
      }
    } catch (err) {
      setError(err.message || "發生錯誤,請再試一次");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-mark">健</div>
          <div>
            <div className="auth-title">健身教練排課系統</div>
            <div className="auth-sub">教練與小編共用的訓練管理平台</div>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")} type="button">
            登入
          </button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")} type="button">
            註冊新帳號
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <label>
                顯示名稱(教練姓名)
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如:Amy"
                  required
                />
              </label>
              <label>
                身份
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="coach">教練</option>
                  <option value="staff">小編</option>
                </select>
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          <label>
            密碼
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 個字元"
              minLength={6}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "處理中…" : mode === "signin" ? "登入" : "建立帳號"}
          </button>
        </form>

        <div className="auth-footnote">
          教練只會看到自己的學員資料,小編登入後可選擇要查看的教練,並可隨時切換。
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   小編選擇教練畫面(進入系統前需先選定要查看哪位教練的資料)
   ============================================================ */
function CoachPickerScreen({ coaches, profile, onSelect, onLogout }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-mark">健</div>
          <div>
            <div className="auth-title">選擇要查看的教練</div>
            <div className="auth-sub">{profile?.full_name || "小編"},請選擇要管理哪位教練的資料</div>
          </div>
        </div>

        {coaches.length === 0 ? (
          <div className="empty-block">目前尚無教練帳號,請先請教練註冊。</div>
        ) : (
          <div className="coach-picker-list">
            {coaches.map((c) => (
              <button key={c.id} type="button" className="coach-picker-item" onClick={() => onSelect(c.id)}>
                <span className="coach-picker-name">{c.full_name}</span>
                <ChevronRight size={18} className="row-arrow" />
              </button>
            ))}
          </div>
        )}

        <button type="button" className="btn-secondary full" onClick={onLogout} style={{ marginTop: 16 }}>
          登出
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   進度條
   ============================================================ */
function ProgressBar({ used, total }) {
  const remaining = Math.max(total - used, 0);
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const low = remaining <= 3;
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className={`progress-fill ${low ? "low" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-labels">
        <span>已用 {used} / {total} 堂</span>
        <span className={low ? "remaining low" : "remaining"}>
          剩餘 {remaining} 堂
          {low && <AlertTriangle size={13} strokeWidth={2.5} />}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   星星評分
   ============================================================ */
function StarRating({ value, onChange, readOnly = false, label }) {
  return (
    <div className="star-rating">
      {label && <span className="star-label">{label}</span>}
      <div className="star-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            className={`star-btn ${n <= value ? "filled" : ""}`}
            onClick={() => onChange && onChange(n)}
            aria-label={`${n} 星`}
          >
            <Star size={20} strokeWidth={1.5} fill={n <= value ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   檔案上傳(合約 / Inbody / 體態照)
   path: storage 內路徑(可能為 null)
   onUploaded(path): 上傳完成後回傳新路徑
   ============================================================ */
function FileUploadSlot({ label, path, onUploaded, onRemove }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let revoke;
    const load = async () => {
      if (!path) {
        setPreviewUrl(null);
        return;
      }
      const { data, error } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(path, 60 * 60);
      if (!error && data) {
        setPreviewUrl(data.signedUrl);
      }
    };
    load();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [path]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(FILES_BUCKET).upload(filePath, file, {
        upsert: false,
      });
      if (upErr) throw upErr;
      await onUploaded(filePath);
    } catch (err) {
      setError(err.message || "上傳失敗");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="file-slot">
      <span className="file-slot-label">{label}</span>
      <div className="file-slot-body">
        {previewUrl ? (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="file-slot-preview">
            <img src={previewUrl} alt={label} />
          </a>
        ) : (
          <div className="file-slot-empty">
            <Camera size={20} />
          </div>
        )}
        <div className="file-slot-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={14} /> {uploading ? "上傳中…" : path ? "更換" : "上傳照片"}
          </button>
          {path && (
            <button type="button" className="icon-btn" onClick={onRemove} title="移除">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: "none" }}
      />
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

/* ============================================================
   共用搜尋框
   ============================================================ */
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <span className="search-bar-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "搜尋…"}
      />
      {value && (
        <button type="button" className="search-bar-clear" onClick={() => onChange("")} aria-label="清除搜尋">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ============================================================
   不限張數照片相簿(合約照片 / Inbody・體態照共用)
   photos: member_photos 資料列陣列(已篩選好 photo_type)
   ============================================================ */
function PhotoGallery({ photos, onAddPhoto, onDeletePhoto, onUpdatePhoto, emptyText }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadDate, setUploadDate] = useState(todayStr());

  const sorted = photos.slice().sort((a, b) => (b.photo_date || "").localeCompare(a.photo_date || ""));

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(FILES_BUCKET).upload(filePath, file, { upsert: false });
        if (upErr) throw upErr;
        await onAddPhoto({ file_path: filePath, photo_date: uploadDate || todayStr() });
      }
    } catch (err) {
      setError(err.message || "上傳失敗");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="photo-gallery">
      <label className="block-label">
        本次上傳照片的日期
        <div className="date-time-wrap">
          <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
        </div>
      </label>
      <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
        <Upload size={14} /> {uploading ? "上傳中…" : "從相簿上傳照片(可多選)"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        style={{ display: "none" }}
      />
      {error && <div className="auth-error">{error}</div>}

      {sorted.length === 0 ? (
        <div className="empty-block small">{emptyText || "尚無照片紀錄。"}</div>
      ) : (
        <div className="photo-grid">
          {sorted.map((p) => (
            <PhotoCard key={p.id} photo={p} onDelete={() => onDeletePhoto(p.id)} onUpdateDate={(d) => onUpdatePhoto(p.id, { photo_date: d })} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({ photo, onDelete, onUpdateDate }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(photo.file_path, 60 * 60)
      .then(({ data, error }) => {
        if (active && !error && data) setPreviewUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [photo.file_path]);

  return (
    <div className="photo-card">
      {previewUrl ? (
        <a href={previewUrl} target="_blank" rel="noreferrer" className="photo-card-img">
          <img src={previewUrl} alt="" />
        </a>
      ) : (
        <div className="photo-card-img photo-card-loading">
          <Camera size={18} />
        </div>
      )}
      <div className="photo-card-foot">
        <input
          type="date"
          className="photo-card-date-input"
          value={photo.photo_date || ""}
          onChange={(e) => onUpdateDate(e.target.value)}
        />
        <button type="button" className="icon-btn" onClick={onDelete} title="刪除">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   提醒判斷工具
   ============================================================ */

// Inbody 提醒:回傳 'due' | 'soon' | null
// 若女學員生理期將至(3天內),inbody 提醒順延 7 天計算
function inbodyReminderStatus(member, todayDateStr) {
  if (member.member_type !== "member") return null;
  if (!member.last_inbody_date) return "due"; // 從未記錄過,提醒拍攝
  const interval = member.inbody_interval_days || 30;
  let dueDate = dateStrAdd(member.last_inbody_date, interval);

  // 若月經即將來(3天內)或正在經期中,順延 7 天
  const period = menstrualReminderStatus(member, todayDateStr);
  if (period) {
    dueDate = dateStrAdd(dueDate, 7);
  }

  const diff = daysBetween(todayDateStr, dueDate);
  if (diff <= 0) return "due";
  if (diff <= 3) return "soon";
  return null;
}

// 生理期提醒:回傳 'soon'(來經前3天內含當天) | null
function menstrualReminderStatus(member, todayDateStr) {
  if (member.member_type !== "member") return null;
  if (!member.track_menstrual_cycle || !member.last_period_date) return null;
  const cycle = member.cycle_length_days || 28;
  // 找下一次經期日期(可能需往後推多個週期)
  let next = member.last_period_date;
  let guard = 0;
  while (daysBetween(todayDateStr, next) < -3 && guard < 24) {
    next = dateStrAdd(next, cycle);
    guard++;
  }
  const diff = daysBetween(todayDateStr, next);
  if (diff >= 0 && diff <= 3) return "soon";
  if (diff < 0 && diff >= -7) return "soon"; // 經期中也提示教練調整訓練
  return null;
}

// 付款分期提醒:7天內到期或已逾期且未付
function paymentDueStatus(dueDate, isPaid, todayDateStr) {
  if (!dueDate || isPaid) return null;
  const diff = daysBetween(todayDateStr, dueDate);
  if (diff < 0) return "overdue";
  if (diff <= 7) return "due-soon";
  return null;
}

/* ============================================================
   排課衝突檢查工具
   ============================================================ */

// "HH:MM" 或 "HH:MM:SS" 轉為分鐘數
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

// 兩個時間區間 [aStart, aEnd) 與 [bStart, bEnd) 是否重疊(單位:分鐘)
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

// 取得某日期字串(YYYY-MM-DD)對應的星期(0=週日...6=週六)
const weekdayOf = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay();
};

// 可排課的時間範圍:08:00 - 23:00,此範圍外一律無法排課
const SCHEDULABLE_START_MIN = 8 * 60; // 08:00
const SCHEDULABLE_END_MIN = 23 * 60; // 23:00

// 檢查某教練在指定日期/時間/時長排課是否會衝突
// 回傳 null 表示無衝突,否則回傳衝突原因字串
function findScheduleConflict({ coachId, date, startTime, durationMin, sessions, blockedTimes, excludeSessionId }) {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + Number(durationMin || 0);

  // 0. 僅能排在 08:00-23:00 之間,此範圍外的時段一律不開放排課
  if (newStart < SCHEDULABLE_START_MIN || newEnd > SCHEDULABLE_END_MIN) {
    return `課堂時間必須在 08:00 - 23:00 之間,23:00 - 08:00 為系統限制不可排課時段`;
  }

  // 1. 與其他已排定/已完成的課堂時間重疊
  const conflictSession = (sessions || []).find((s) => {
    if (s.id === excludeSessionId) return false;
    if (s.coach_id !== coachId) return false;
    if (s.session_date !== date) return false;
    if (s.status === "completed") return false; // 已完成的課堂不視為衝突
    const sStart = timeToMinutes(s.start_time);
    const sEnd = sStart + Number(s.duration_min || 0);
    return rangesOverlap(newStart, newEnd, sStart, sEnd);
  });
  if (conflictSession) {
    return `此時段與已排定的課堂重疊(${conflictSession.start_time} - ${pad2(Math.floor((timeToMinutes(conflictSession.start_time) + Number(conflictSession.duration_min || 0)) / 60))}:${pad2((timeToMinutes(conflictSession.start_time) + Number(conflictSession.duration_min || 0)) % 60)})`;
  }

  // 2. 與教練設定的不可排課時段重疊
  const weekday = weekdayOf(date);
  const conflictBlock = (blockedTimes || []).find((b) => {
    if (b.coach_id !== coachId) return false;
    const matchesDate = b.block_date && b.block_date === date;
    const matchesWeekday = b.weekday !== null && b.weekday !== undefined && Number(b.weekday) === weekday;
    if (!matchesDate && !matchesWeekday) return false;
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    return rangesOverlap(newStart, newEnd, bStart, bEnd);
  });
  if (conflictBlock) {
    return `此時段為教練設定的不可排課時段${conflictBlock.label ? `(${conflictBlock.label})` : ""}(${conflictBlock.start_time} - ${conflictBlock.end_time})`;
  }

  return null;
}

/* ============================================================
   總覽
   ============================================================ */
/* ============================================================
   本月新增體驗課 / 本月新增學員 明細 Modal
   ============================================================ */
function MonthlyListModal({ title, items, onClose, onOpenMember, renderItem }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {items.length === 0 ? (
            <div className="empty-block">本月尚無資料。</div>
          ) : (
            <div className="list">
              {items.map((m) => (
                <button
                  key={m.id}
                  className="list-row clickable"
                  onClick={() => {
                    onOpenMember(m.id);
                    onClose();
                  }}
                >
                  <div className="list-row-main">
                    <span className="list-row-title">{m.name}</span>
                    {renderItem(m)}
                  </div>
                  <ChevronRight size={18} className="row-arrow" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <div className="spacer" />
          <button className="btn-primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

function Overview({ members, sessions, payments, onGoSchedule, onOpenSession, onOpenMember }) {
  const today = todayStr();
  const [showTrialDetail, setShowTrialDetail] = useState(false);
  const [showConvertedDetail, setShowConvertedDetail] = useState(false);
  const [showAbsentDetail, setShowAbsentDetail] = useState(false);

  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  // 本週日期範圍(週日~週六)
  const weekStart = useMemo(() => {
    const wd = weekdayOf(today);
    return dateStrAdd(today, -wd);
  }, [today]);
  const weekEnd = useMemo(() => dateStrAdd(weekStart, 6), [weekStart]);

  const stats = useMemo(() => {
    const pending = sessions.filter((s) => s.status === "scheduled").length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const totalRemaining = members.reduce(
      (sum, m) => (m.member_type === "member" ? sum + Math.max(m.total_sessions - m.used_sessions, 0) : sum), 0
    );
    const activeMemberCount = members.filter(
      (m) => m.member_type === "member" && Math.max(m.total_sessions - m.used_sessions, 0) > 0
    ).length;
    const monthPrefix = today.slice(0, 7);
    const monthlyTrials = members.filter(
      (m) => m.member_type === "trial" && m.created_at && m.created_at.slice(0, 7) === monthPrefix
    );
    const monthlyConverted = members.filter(
      (m) => m.member_type === "member" && m.converted_at && m.converted_at.slice(0, 7) === monthPrefix
    );
    // 本週上課總堂數(已完成)
    const weeklyCompleted = sessions.filter(
      (s) => s.status === "completed" && s.session_date >= weekStart && s.session_date <= weekEnd
    ).length;
    // 本週學員請假(is_absent = true,本週內的排定課堂)
    const weeklyAbsent = sessions.filter(
      (s) => s.is_absent && s.session_date >= weekStart && s.session_date <= weekEnd
    );

    return { pending, completed, totalRemaining, activeMemberCount, monthlyTrials, monthlyConverted, weeklyCompleted, weeklyAbsent };
  }, [members, sessions, today, weekStart, weekEnd]);

  // 今天的課堂(排定中),依時間排序
  const todaySessions = useMemo(() => {
    return sessions
      .filter((s) => s.status === "scheduled" && s.session_date === today && !s.is_absent)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [sessions, today]);

  // 學員提醒 map(Inbody / 生理期)
  const memberAlertMap = useMemo(() => {
    const scheduledMemberIds = new Set(
      sessions.filter((s) => s.status === "scheduled" && s.session_date >= today).map((s) => s.member_id)
    );
    const map = {};
    members.forEach((m) => {
      if (!scheduledMemberIds.has(m.id)) return;
      const inbody = inbodyReminderStatus(m, today);
      const period = menstrualReminderStatus(m, today);
      if (inbody || period) map[m.id] = { inbody, period };
    });
    return map;
  }, [members, sessions, today]);

  // 付款提醒:只針對今天有排課的學員
  const paymentReminders = useMemo(() => {
    const scheduledMemberIdsToday = new Set(
      sessions.filter((s) => s.status === "scheduled" && s.session_date === today).map((s) => s.member_id)
    );
    return payments
      .filter((p) => scheduledMemberIdsToday.has(p.member_id))
      .map((p) => ({ payment: p, due: paymentDueStatus(p.due_date, p.is_paid, today) }))
      .filter((x) => x.due)
      .sort((a, b) => (a.payment.due_date || "").localeCompare(b.payment.due_date || ""));
  }, [payments, sessions, today]);

  // 行事曆相關常數
  const CAL_H = 56; // 每小時 px
  const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00–22:00 顯示刻度

  const timeToTop = (t) => {
    const [h, m] = (t || "08:00").split(":").map(Number);
    return ((h - 8) * 60 + (m || 0)) / 60 * CAL_H;
  };
  const durationToHeight = (min) => Math.max(Number(min || 60) / 60 * CAL_H, 28);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>總覽</h1>
          <p className="page-sub">今天是 {fmtDate(today)}</p>
        </div>
        <button className="btn-primary" onClick={onGoSchedule}>
          <Plus size={16} /> 新增排課
        </button>
      </div>

      {/* 本月統計 */}
      <div className="stat-grid">
        <div className="stat-card clickable" onClick={() => setShowTrialDetail(true)} role="button" tabIndex={0}>
          <span className="stat-label">本月新增體驗課</span>
          <span className="stat-value accent">{stats.monthlyTrials.length}</span>
        </div>
        <div className="stat-card clickable" onClick={() => setShowConvertedDetail(true)} role="button" tabIndex={0}>
          <span className="stat-label">本月新增學員</span>
          <span className="stat-value accent">{stats.monthlyConverted.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">本週上課堂數</span>
          <span className="stat-value">{stats.weeklyCompleted}</span>
        </div>
        <div className="stat-card clickable" onClick={() => setShowAbsentDetail(true)} role="button" tabIndex={0}>
          <span className="stat-label">本週請假堂數</span>
          <span className="stat-value warn">{stats.weeklyAbsent.length}</span>
        </div>
      </div>

      {showTrialDetail && (
        <MonthlyListModal title="本月新增體驗課" onClose={() => setShowTrialDetail(false)} items={stats.monthlyTrials} onOpenMember={onOpenMember}
          renderItem={(m) => {
            const loc = sessions.find((s) => s.member_id === m.id)?.location || "";
            return <span className="list-row-sub">{m.trial_session_date ? `${fmtDate(m.trial_session_date)} ${(m.trial_start_time || "").slice(0,5)}` : "尚未排課"}{loc ? ` · ${loc}` : ""}</span>;
          }}
        />
      )}
      {showConvertedDetail && (
        <MonthlyListModal title="本月新增學員" onClose={() => setShowConvertedDetail(false)} items={stats.monthlyConverted} onOpenMember={onOpenMember}
          renderItem={(m) => <span className="list-row-sub">轉為正式學員:{m.converted_at ? fmtDate(m.converted_at.slice(0,10)) : "未知"}</span>}
        />
      )}
      {showAbsentDetail && (
        <MonthlyListModal title="本週請假堂數" onClose={() => setShowAbsentDetail(false)}
          items={stats.weeklyAbsent.map((s) => ({ id: s.member_id, name: memberMap[s.member_id]?.name || "未知學員", _session: s }))}
          onOpenMember={onOpenMember}
          renderItem={(item) => <span className="list-row-sub">{fmtDate(item._session.session_date)} {(item._session.start_time || "").slice(0,5)} · {item._session.absent_deduct === false ? "不扣課" : "扣課"}</span>}
        />
      )}

      {/* 今日課堂:單日時間軸,仿行事曆 */}
      <div className="section">
        <div className="section-head">
          <CalendarDays size={18} />
          <h2>今天 {fmtDate(today)} ({WEEKDAY_LABELS[weekdayOf(today)]})</h2>
        </div>

        <div className="overview-timeline-wrap">
          <div className="overview-timeline" style={{ height: `${15 * CAL_H}px` }}>
            {/* 時間刻度 */}
            {HOURS.map((h) => (
              <div key={h} className="ovt-hour" style={{ top: `${(h - 8) * CAL_H}px` }}>
                <span className="ovt-label">{pad2(h)}:00</span>
                <div className="ovt-line" />
              </div>
            ))}

            {/* 課堂色塊 */}
            {todaySessions.map((s) => {
              const member = memberMap[s.member_id];
              const isTrial = member?.member_type === "trial";
              const alert = memberAlertMap[s.member_id];
              const top = timeToTop(s.start_time);
              const height = durationToHeight(s.duration_min);
              return (
                <button
                  key={s.id}
                  className={`ovt-block ${isTrial ? "trial" : "member"}`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  onClick={() => onOpenSession(s)}
                >
                  <span className="ovt-block-name">
                    {member?.name || "未知"}
                    {isTrial && <span className="pill pill-trial" style={{fontSize:"9px",padding:"0 4px"}}>體驗</span>}
                    {!s.deduct_session && <span className="pill pill-free" style={{fontSize:"9px",padding:"0 4px"}}>不扣</span>}
                    {s.location ? ` · ${s.location}` : ""}
                  </span>
                  {(alert?.inbody || alert?.period) && (
                    <span className="ovt-block-alert">
                      {alert.inbody && "📷 Inbody"}
                      {alert.period && " 🩸生理期"}
                    </span>
                  )}
                  {s.coach_notes && <span className="ovt-block-note">{s.coach_notes}</span>}
                </button>
              );
            })}

            {todaySessions.length === 0 && (
              <div className="ovt-empty">今天沒有排定的課堂</div>
            )}
          </div>
        </div>
      </div>

      {/* 付款提醒:只在今天有排課的學員中顯示 */}
      {paymentReminders.length > 0 && (
        <div className="section">
          <div className="section-head alert-head">
            <Bell size={18} />
            <h2>付款提醒(今天有排課的學員)</h2>
          </div>
          <div className="list">
            {paymentReminders.map(({ payment, due }) => {
              const member = memberMap[payment.member_id];
              return (
                <button key={payment.id} className="list-row clickable alert-row" onClick={() => onOpenMember(payment.member_id)}>
                  <div className="list-row-main">
                    <span className="list-row-title alert-text">{member?.name || "未知學員"} · 第 {payment.installment_no}/{payment.installment_total} 期</span>
                    <span className="list-row-sub">應付日:{fmtDate(payment.due_date)} · {fmtMoney(payment.amount)}</span>
                  </div>
                  <span className={`pill ${due === "overdue" ? "pill-warn" : "pill-due"}`}>{due === "overdue" ? "已逾期" : "即將到期"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   排課管理
   ============================================================ */
function ScheduleManager({ members, sessions, onAdd, onOpenSession, presetMemberId, onPresetUsed, venues, blockedTimes, searchQuery, onSearchChange, globalStats }) {
  const [showForm, setShowForm] = useState(!!presetMemberId);
  const [memberId, setMemberId] = useState(presetMemberId || "");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [deductSession, setDeductSession] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // 重複行程設定:none = 不重複, weekly = 每週, biweekly = 每兩週
  const [repeatMode, setRepeatMode] = useState("none");
  const [repeatCount, setRepeatCount] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (presetMemberId) {
      setMemberId(presetMemberId);
      setShowForm(true);
      onPresetUsed && onPresetUsed();
    }
  }, [presetMemberId]);

  useEffect(() => {
    const member = members.find((m) => m.id === memberId);
    if (member?.member_type === "trial") {
      setDeductSession(false);
    }
  }, [memberId, members]);

  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  const upcoming = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return sessions
      .filter((s) => s.status === "scheduled")
      .filter((s) => {
        if (!q) return true;
        const m = memberMap[s.member_id];
        return (m?.name || "").toLowerCase().includes(q);
      })
      .sort((a, b) => (a.session_date + a.start_time).localeCompare(b.session_date + b.start_time));
  }, [sessions, searchQuery, memberMap]);

  const resetForm = () => {
    setShowForm(false);
    setMemberId("");
    setDate(todayStr());
    setTime("10:00");
    setDuration(60);
    setLocation("");
    setDeductSession(true);
    setRepeatMode("none");
    setRepeatCount(4);
    setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!memberId) {
      setError("請選擇學員");
      return;
    }
    const member = members.find((m) => m.id === memberId);
    const willDeduct = member?.member_type === "trial" ? false : deductSession;

    // 依重複設定產生所有要排定的日期清單
    const stepDays = repeatMode === "weekly" ? 7 : repeatMode === "biweekly" ? 14 : 0;
    const occurrenceCount = repeatMode === "none" ? 1 : Math.max(Number(repeatCount) || 1, 1);
    const dateList = Array.from({ length: occurrenceCount }, (_, i) => dateStrAdd(date, i * stepDays));

    if (member?.member_type === "member" && willDeduct) {
      const remaining = Math.max(member.total_sessions - member.used_sessions, 0);
      if (remaining < occurrenceCount) {
        setError(`此學員剩餘堂數不足(剩餘 ${remaining} 堂,本次需要 ${occurrenceCount} 堂),請先為學員購課,或取消勾選「扣課」,或減少重複次數`);
        return;
      }
    }

    // 逐筆檢查衝突;已存在排程中(包含本次清單中前面已通過檢查的日期)都納入比對
    const toCreate = [];
    const conflicts = [];
    const tentativeSessions = [...sessions];
    for (const d of dateList) {
      const conflict = member?.coach_id
        ? findScheduleConflict({
            coachId: member.coach_id,
            date: d,
            startTime: time,
            durationMin: duration,
            sessions: tentativeSessions,
            blockedTimes,
          })
        : null;
      if (conflict) {
        conflicts.push(`${fmtDate(d)}:${conflict}`);
      } else {
        toCreate.push(d);
        // 將本次暫定建立的課堂也加入比對清單,避免重複行程內部彼此重疊卻沒被擋下
        tentativeSessions.push({
          coach_id: member?.coach_id,
          session_date: d,
          start_time: time,
          duration_min: Number(duration),
          status: "scheduled",
        });
      }
    }

    if (toCreate.length === 0) {
      setError(`無法排課,所有日期皆有衝突:\n${conflicts.join("\n")}`);
      return;
    }

    setSubmitting(true);
    await onAdd(
      toCreate.map((d) => ({
        member_id: memberId,
        session_date: d,
        start_time: time,
        duration_min: Number(duration),
        location: location.trim(),
        deduct_session: willDeduct,
      }))
    );
    setSubmitting(false);

    if (conflicts.length > 0) {
      setInfo(`已成功排定 ${toCreate.length} 堂,以下 ${conflicts.length} 個日期因衝突未排入:\n${conflicts.join("\n")}`);
      // 保留表單開啟讓使用者看到結果,不自動清空
    } else {
      resetForm();
    }
  };

  const selectedMember = members.find((m) => m.id === memberId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>排課管理</h1>
          <p className="page-sub">安排課堂,完成後一鍵進入訓練記錄</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "取消" : "新增排課"}
        </button>
      </div>

      {globalStats && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">待上課堂</span>
            <span className="stat-value accent">{globalStats.pending}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">已完成課堂</span>
            <span className="stat-value">{globalStats.completed}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">學員剩餘總堂數</span>
            <span className="stat-value">{globalStats.totalRemaining}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">學員總數</span>
            <span className="stat-value">{globalStats.activeMemberCount}</span>
          </div>
        </div>
      )}

      <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="搜尋學員姓名,列出該學員所有已安排未完成課程…" />

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-grid form-grid-1col">
            <label>
              學員
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                <option value="">請選擇學員</option>
                <optgroup label="學員">
                  {members.filter((m) => m.member_type === "member").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}(剩餘 {Math.max(m.total_sessions - m.used_sessions, 0)} 堂)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="體驗課學員">
                  {members.filter((m) => m.member_type === "trial").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}(體驗課)
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <label>
              日期
              <div className="date-time-wrap">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            </label>
            <label>
              時間
              <div className="date-time-wrap">
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} min="08:00" max="23:00" required />
              </div>
            </label>
            <label>
              時長(分鐘)
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value={60}>60</option>
                <option value={65}>65</option>
                <option value={70}>70</option>
                <option value={75}>75</option>
                <option value={80}>80</option>
                <option value={90}>90</option>
                <option value={120}>120</option>
              </select>
            </label>
            <label>
              地點
              <select value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">請選擇地點(選填)</option>
                {(venues || []).map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid form-grid-1col">
            <label>
              重複
              <select value={repeatMode} onChange={(e) => setRepeatMode(e.target.value)}>
                <option value="none">不重複</option>
                <option value="weekly">每週重複</option>
                <option value="biweekly">每兩週重複</option>
              </select>
            </label>
            {repeatMode !== "none" && (
              <label>
                重複次數(含本次)
                <input
                  type="number"
                  min={2}
                  max={52}
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(e.target.value)}
                />
              </label>
            )}
          </div>
          {repeatMode !== "none" && (
            <div className="hint-box">
              將從 {fmtDate(date)} 開始,{repeatMode === "weekly" ? "每週" : "每兩週"}同一時間排定一堂,共 {Math.max(Number(repeatCount) || 1, 1)} 堂。若中間有時段衝突,該堂會自動略過,其餘仍會排定。
            </div>
          )}

          {selectedMember?.member_type === "member" && (
            <label className="checkbox-row">
              <input type="checkbox" checked={deductSession} onChange={(e) => setDeductSession(e.target.checked)} />
              此堂扣除學員堂數
            </label>
          )}
          {selectedMember?.member_type === "trial" && (
            <div className="hint-box">體驗課不會計入堂數。</div>
          )}

          {error && <div className="auth-error" style={{ whiteSpace: "pre-line" }}>{error}</div>}
          {info && <div className="hint-box" style={{ whiteSpace: "pre-line" }}>{info}</div>}
          <button type="submit" className="btn-primary full" disabled={submitting}>
            {submitting ? "排課中…" : "確認排課"}
          </button>
        </form>
      )}

      <div className="section">
        <div className="section-head">
          <Clock size={18} />
          <h2>{searchQuery ? `搜尋結果(${upcoming.length})` : "排定中的課堂"}</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-block">{searchQuery ? "找不到符合的學員或課堂。" : "目前沒有排定中的課堂。"}</div>
        ) : (
          <div className="list">
            {upcoming.map((s) => {
              const member = memberMap[s.member_id];
              const isTrial = member?.member_type === "trial";
              return (
                <button
                  key={s.id}
                  className={`list-row clickable session-row ${isTrial ? "trial-row" : "member-row"}`}
                  onClick={() => onOpenSession(s)}
                >
                  <div className="list-row-main">
                    <span className="list-row-title">
                      {member?.name || "未知學員"}
                      {isTrial && <span className="pill pill-trial">體驗課</span>}
                      {!s.deduct_session && member?.member_type === "member" && (
                        <span className="pill pill-free">不扣課</span>
                      )}
                    </span>
                    <span className="list-row-sub">
                      {fmtDate(s.session_date)} · {s.start_time} · {s.duration_min} 分鐘
                      {s.location ? ` · ${s.location}` : ""}
                    </span>
                  </div>
                  <span className="pill pill-go">
                    進入訓練記錄 <ChevronRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   訓練記錄 / 課堂詳情 Modal
   ============================================================ */
function SessionModal({ session, member, venues, sessions, onClose, onSave, onDelete }) {
  // 找到同一學員的最近一次「已完成」課堂紀錄(排除當前這堂)作為上次記錄 placeholder
  const prevSession = useMemo(() => {
    if (!sessions || !member) return null;
    return sessions
      .filter((s) => s.member_id === member.id && s.status === "completed" && s.id !== session.id && s.session_date <= session.session_date)
      .sort((a, b) => (b.session_date + b.start_time).localeCompare(a.session_date + a.start_time))[0] || null;
  }, [sessions, member, session]);

  const ph = (key, defaultText) => {
    const prev = prevSession?.[key];
    return prev ? `上次:${prev}` : defaultText;
  };
  const [schedForm, setSchedForm] = useState({
    session_date: session.session_date || "",
    start_time: session.start_time || "",
    duration_min: session.duration_min || 60,
    location: session.location || "",
  });
  const [form, setForm] = useState({
    warmup: session.warmup || "",
    main_training: session.main_training || "",
    cooldown: session.cooldown || "",
    coach_notes: session.coach_notes || "",
    energy_rating: session.energy_rating || 0,
    soreness_rating: session.soreness_rating || 0,
    mood_rating: session.mood_rating || 0,
    member_feedback: session.member_feedback || "",
    _absent: session.is_absent || false,
    _absentDeduct: session.absent_deduct !== false,
  });
  const [saving, setSaving] = useState(false);
  const [schedError, setSchedError] = useState("");

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateSched = (key, val) => setSchedForm((f) => ({ ...f, [key]: val }));

  const handleSave = async (markCompleted) => {
    setSchedError("");
    if (session.status !== "completed" && schedForm.start_time) {
      const startMin = timeToMinutes(schedForm.start_time);
      const endMin = startMin + Number(schedForm.duration_min || 0);
      if (startMin < 8 * 60 || endMin > 23 * 60) {
        setSchedError("課堂時間必須在 08:00 - 23:00 之間,23:00 - 08:00 為系統限制不可排課時段");
        return;
      }
    }
    // 防呆:未到排定的開始時間前,不可標記為完成課堂(僅儲存草稿不受此限制)
    if (markCompleted && session.status !== "completed") {
      const nowCheck = new Date();
      const nowDateCheck = todayStr();
      const sDate = schedForm.session_date || session.session_date;
      const sTime = schedForm.start_time || session.start_time;
      const reached =
        !sDate || !sTime
          ? true
          : sDate < nowDateCheck
          ? true
          : sDate > nowDateCheck
          ? false
          : nowCheck.getHours() * 60 + nowCheck.getMinutes() >= timeToMinutes(sTime);
      if (!reached) {
        setSchedError("課堂時間尚未到達,無法標記為完成課堂,請改用「儲存草稿」。");
        return;
      }
    }
    setSaving(true);
    await onSave(session.id, {
      ...form,
      ...schedForm,
      markCompleted,
      is_absent: form._absent,
      absent_deduct: form._absentDeduct,
    });
    setSaving(false);
    onClose();
  };

  const isCompleted = session.status === "completed";
  const isTrial = member?.member_type === "trial";

  // 判斷目前是否已到達(或超過)課堂排定的開始時間;未到時間前不可標記為完成課堂,
  // 避免提前把尚未發生的課堂記錄為已完成。已完成的課堂(更新紀錄)不受此限制。
  const now = new Date();
  const nowDateStr = todayStr();
  const sessionDateStr = schedForm.session_date || session.session_date;
  const sessionStartTime = schedForm.start_time || session.start_time;
  const hasReachedStartTime = (() => {
    if (!sessionDateStr || !sessionStartTime) return true;
    if (sessionDateStr < nowDateStr) return true;
    if (sessionDateStr > nowDateStr) return false;
    // 同一天,比對目前時刻是否已到達排定的開始時間
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes >= timeToMinutes(sessionStartTime);
  })();
  const canComplete = isCompleted || hasReachedStartTime;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{member?.name || "未知學員"} 的訓練記錄</h3>
            <p className="modal-sub">
              {fmtDate(session.session_date)} · {(session.start_time || "").slice(0,5)} · {session.duration_min} 分鐘
              {session.location ? ` · ${session.location}` : ""}
              {isTrial && <span className="pill pill-trial">體驗課</span>}
              {!session.deduct_session && !isTrial && <span className="pill pill-free">不扣課</span>}
              {isCompleted && <span className="pill pill-done">已完成</span>}
            </p>
            {session.edited_at && (
              <p className="modal-edit-info">
                最後編輯:{session.edited_by_name || "未知"} · {new Date(session.edited_at).toLocaleString("zh-TW", { year:"numeric", month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" })}
              </p>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 排課基本資訊編輯:已完成的課堂仍可更新地點,排定中的可改日期/時間 */}
          <div className="sched-edit-grid">
            <label className="block-label">
              日期
              <div className="date-time-wrap">
                <input type="date" value={schedForm.session_date} onChange={(e) => updateSched("session_date", e.target.value)} disabled={isCompleted} />
              </div>
            </label>
            <label className="block-label">
              時間
              <div className="date-time-wrap">
                <input type="time" value={schedForm.start_time} onChange={(e) => updateSched("start_time", e.target.value)} min="08:00" max="23:00" disabled={isCompleted} />
              </div>
            </label>
            <label className="block-label">
              時長(分鐘)
              <select value={schedForm.duration_min} onChange={(e) => updateSched("duration_min", e.target.value)} disabled={isCompleted}>
                {[60,65,70,75,80,90,120].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="block-label">
              地點
              <select value={schedForm.location} onChange={(e) => updateSched("location", e.target.value)}>
                <option value="">無</option>
                {(venues || []).map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </label>
          </div>
          {schedError && <div className="auth-error">{schedError}</div>}

          <div className="divider" />

          <label className="block-label">
            熱身
            <textarea rows={2} value={form.warmup} onChange={(e) => update("warmup", e.target.value)} placeholder={ph("warmup", "例如:動態伸展 5 分鐘、滾筒放鬆")} />
          </label>
          <label className="block-label">
            主訓練
            <textarea rows={3} value={form.main_training} onChange={(e) => update("main_training", e.target.value)} placeholder={ph("main_training", "例如:深蹲 4x8、臥推 4x8、引體向上 3x10")} />
          </label>
          <label className="block-label">
            收操
            <textarea rows={2} value={form.cooldown} onChange={(e) => update("cooldown", e.target.value)} placeholder={ph("cooldown", "例如:靜態伸展、呼吸放鬆 5 分鐘")} />
          </label>
          <label className="block-label">
            教練筆記
            <textarea rows={2} value={form.coach_notes} onChange={(e) => update("coach_notes", e.target.value)} placeholder={ph("coach_notes", "給下次課程的提醒、動作修正建議等")} />
          </label>

          <div className="divider" />

          <h4 className="section-title-sm">學員身體反饋</h4>
          <div className="rating-grid">
            <StarRating label="體力感" value={form.energy_rating} onChange={(v) => update("energy_rating", v)} />
            <StarRating label="痠痛感" value={form.soreness_rating} onChange={(v) => update("soreness_rating", v)} />
            <StarRating label="心情" value={form.mood_rating} onChange={(v) => update("mood_rating", v)} />
          </div>

          <label className="block-label">
            學員感受留言
            <textarea rows={2} value={form.member_feedback} onChange={(e) => update("member_feedback", e.target.value)} placeholder="學員對本次課程的感受、想對教練說的話" />
          </label>
        </div>

        {/* 請假區塊:只在未完成課堂上顯示 */}
        {!isCompleted && (
          <div className="absent-section">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={!!form._absent}
                onChange={(e) => update("_absent", e.target.checked)}
              />
              學員請假
            </label>
            {form._absent && (
              <label className="checkbox-row" style={{ marginLeft: 24 }}>
                <input
                  type="checkbox"
                  checked={form._absentDeduct !== false}
                  onChange={(e) => update("_absentDeduct", e.target.checked)}
                />
                請假扣課
              </label>
            )}
          </div>
        )}
        {session.is_absent && (
          <div className="hint-box" style={{ marginTop: 8 }}>
            此課堂已標記為請假{session.absent_deduct === false ? "（不扣課）" : "（扣課）"}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-danger" onClick={() => onDelete(session.id)}>
            刪除課堂
          </button>
          <div className="spacer" />
          <button className="btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
            {form._absent ? "確認請假" : "儲存草稿"}
          </button>
          <button className="btn-primary" onClick={() => handleSave(true)} disabled={saving || !canComplete || form._absent} title={!canComplete ? "課堂尚未到開始時間,無法標記為完成" : form._absent ? "已標記請假,無法完成課堂" : undefined}>
            {isCompleted ? "更新紀錄" : "完成課堂並儲存"}
          </button>
        </div>
        {!canComplete && !form._absent && (
          <p className="modal-hint" style={{ marginTop: 8, color: "var(--color-warn)" }}>
            課堂時間尚未到達,目前只能先「儲存草稿」,到了排定時間後才能完成課堂。
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   學員管理 — 主元件
   ============================================================ */
function MembersManager({
  members,
  sessions,
  payments,
  bodyRecords,
  manualCharges,
  periodRecords,
  memberPhotos,
  purchaseRecords,
  coaches,
  isStaff,
  currentCoachId,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onPurchase,
  onSchedule,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onAddBodyRecord,
  onUpdateBodyRecord,
  onUploadFile,
  onAddManualCharge,
  onDeleteManualCharge,
  onAddPeriodRecord,
  onDeletePeriodRecord,
  onAddMemberPhoto,
  onDeleteMemberPhoto,
  onUpdateMemberPhoto,
  onDeletePurchaseRecord,
  onOpenSession,
  openMemberId,
  onMemberDetailHandled,
  searchQuery,
  onSearchChange,
}) {
  const [showForm, setShowForm] = useState(false);
  const [detailFor, setDetailFor] = useState(null);
  const [purchaseFor, setPurchaseFor] = useState(null);

  const q = (searchQuery || "").trim().toLowerCase();
  const matchesSearch = (m) => !q || (m.name || "").toLowerCase().includes(q);
  const regularMembers = members.filter((m) => m.member_type === "member" && matchesSearch(m));
  const trialMembers = members.filter((m) => m.member_type === "trial" && matchesSearch(m));

  useEffect(() => {
    if (openMemberId) {
      const m = members.find((mm) => mm.id === openMemberId);
      if (m) setDetailFor(m);
      onMemberDetailHandled && onMemberDetailHandled();
    }
  }, [openMemberId, members]);

  useEffect(() => {
    if (detailFor) {
      const fresh = members.find((m) => m.id === detailFor.id);
      if (fresh) setDetailFor(fresh);
      else setDetailFor(null);
    }
  }, [members]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>學員管理</h1>
          <p className="page-sub">追蹤購課與堂數,剩餘 ≤ 3 堂會提示補課</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "取消" : "新增學員"}
        </button>
      </div>

      <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="搜尋學員姓名…" />

      {showForm && (
        <AddMemberForm
          coaches={coaches}
          isStaff={isStaff}
          currentCoachId={currentCoachId}
          onAdd={async (payload) => {
            await onAddMember(payload);
            setShowForm(false);
          }}
        />
      )}

      <div className="section">
        <div className="section-head">
          <Users size={18} />
          <h2>學員</h2>
        </div>
        <div className="member-grid">
          {regularMembers.length === 0 && <div className="empty-block">尚無學員,點上方「新增學員」開始建立。</div>}
          {regularMembers.map((m) => {
            const remaining = Math.max(m.total_sessions - m.used_sessions, 0);
            const low = remaining <= 3;
            const today = todayStr();
            const inbody = inbodyReminderStatus(m, today);
            const period = menstrualReminderStatus(m, today);
            return (
              <div className={`member-card ${low ? "low" : ""}`} key={m.id}>
                <div className="member-card-head">
                  <button className="member-name-btn" onClick={() => setDetailFor(m)}>
                    <span className="member-name">{m.name}</span>
                  </button>
                  <div className="member-badges">
                    {inbody && (
                      <span className="badge-warning badge-alert">
                        <Camera size={13} strokeWidth={2.5} /> Inbody
                      </span>
                    )}
                    {period && (
                      <span className="badge-warning badge-alert">
                        <Bell size={13} strokeWidth={2.5} /> 生理期
                      </span>
                    )}
                    {low && (
                      <span className="badge-warning">
                        <AlertTriangle size={13} strokeWidth={2.5} /> 剩餘不足
                      </span>
                    )}
                  </div>
                </div>
                {m.phone && (
                  <div className="member-phone">
                    <Phone size={13} /> {m.phone}
                  </div>
                )}
                <ProgressBar used={m.used_sessions} total={m.total_sessions} />
                <div className="member-actions">
                  <button className="btn-secondary" onClick={() => setPurchaseFor(m)}>
                    <ShoppingCart size={14} /> 購課
                  </button>
                  <button className="btn-secondary" onClick={() => onSchedule(m.id)}>
                    <CalendarPlus size={14} /> 排課
                  </button>
                  <button className="btn-secondary" onClick={() => setDetailFor(m)}>
                    詳情
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <Users size={18} />
          <h2>體驗課學員</h2>
        </div>
        <div className="member-grid">
          {trialMembers.length === 0 && <div className="empty-block">尚無體驗課學員。</div>}
          {trialMembers.map((m) => (
            <div className="member-card trial" key={m.id}>
              <div className="member-card-head">
                <button className="member-name-btn" onClick={() => setDetailFor(m)}>
                  <span className="member-name">{m.name}</span>
                </button>
                <span className={`pill ${m.trial_followup_status === "converted" ? "pill-free" : "pill-trial"}`}>
                  {m.trial_followup_status === "converted" ? "已轉正式" : "追蹤中"}
                </span>
              </div>
              <div className="member-phone">
                <CalendarDays size={13} /> {m.trial_session_date ? `${fmtDate(m.trial_session_date)} ${m.trial_start_time || ""}` : "尚未排課"}
              </div>
              <div className="member-actions">
                <button className="btn-secondary" onClick={() => onSchedule(m.id)}>
                  <CalendarPlus size={14} /> 排課
                </button>
                <button className="btn-secondary" onClick={() => setDetailFor(m)}>
                  詳情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {purchaseFor && (
        <PurchaseModal member={purchaseFor} onClose={() => setPurchaseFor(null)} onPurchase={onPurchase} />
      )}

      {detailFor && detailFor.member_type === "member" && (
        <MemberDetailModal
          member={detailFor}
          sessions={sessions.filter((s) => s.member_id === detailFor.id)}
          payments={payments.filter((p) => p.member_id === detailFor.id)}
          bodyRecords={bodyRecords.filter((b) => b.member_id === detailFor.id)}
          manualCharges={(manualCharges || []).filter((c) => c.member_id === detailFor.id)}
          periodRecords={(periodRecords || []).filter((r) => r.member_id === detailFor.id)}
          memberPhotos={(memberPhotos || []).filter((p) => p.member_id === detailFor.id)}
          purchaseRecords={(purchaseRecords || []).filter((r) => r.member_id === detailFor.id)}
          onClose={() => setDetailFor(null)}
          onUpdateMember={onUpdateMember}
          onDeleteMember={onDeleteMember}
          onAddPayment={onAddPayment}
          onUpdatePayment={onUpdatePayment}
          onDeletePayment={onDeletePayment}
          onAddBodyRecord={onAddBodyRecord}
          onUpdateBodyRecord={onUpdateBodyRecord}
          onUploadFile={onUploadFile}
          onAddManualCharge={onAddManualCharge}
          onDeleteManualCharge={onDeleteManualCharge}
          onAddPeriodRecord={onAddPeriodRecord}
          onDeletePeriodRecord={onDeletePeriodRecord}
          onAddMemberPhoto={onAddMemberPhoto}
          onDeleteMemberPhoto={onDeleteMemberPhoto}
          onUpdateMemberPhoto={onUpdateMemberPhoto}
          onDeletePurchaseRecord={onDeletePurchaseRecord}
          onOpenSession={onOpenSession}
        />
      )}

      {detailFor && detailFor.member_type === "trial" && (
        <TrialDetailModal
          member={detailFor}
          sessions={sessions.filter((s) => s.member_id === detailFor.id)}
          onClose={() => setDetailFor(null)}
          onUpdateMember={onUpdateMember}
          onDeleteMember={onDeleteMember}
          onConvert={onAddMember}
        />
      )}
    </div>
  );
}

/* ============================================================
   新增學員表單
   ============================================================ */
function AddMemberForm({ coaches, isStaff, currentCoachId, onAdd }) {
  const [memberType, setMemberType] = useState("member");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [coachId, setCoachId] = useState(currentCoachId || "");
  const [packageSize, setPackageSize] = useState(10);
  const [pricePerSession, setPricePerSession] = useState("");

  // 體驗課欄位
  const [trialDate, setTrialDate] = useState(todayStr());
  const [trialTime, setTrialTime] = useState("10:00");
  const [trialGoal, setTrialGoal] = useState("");
  const [trialFee, setTrialFee] = useState("");
  const [trialPaymentLast5, setTrialPaymentLast5] = useState("");
  const [trialHealth, setTrialHealth] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (memberType === "member") {
      await onAdd({
        member_type: "member",
        name: name.trim(),
        phone: phone.trim(),
        coach_id: coachId || currentCoachId,
        total_sessions: Number(packageSize),
        used_sessions: 0,
        price_per_session: pricePerSession === "" ? 0 : Number(pricePerSession),
      });
    } else {
      await onAdd({
        member_type: "trial",
        name: name.trim(),
        coach_id: coachId || currentCoachId,
        trial_session_date: trialDate,
        trial_start_time: trialTime,
        training_goal: trialGoal.trim(),
        trial_fee: trialFee === "" ? 0 : Number(trialFee),
        trial_payment_last5: trialPaymentLast5.trim(),
        health_notes: trialHealth.trim(),
        trial_followup_status: "pending",
      });
    }
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          類型
          <select value={memberType} onChange={(e) => setMemberType(e.target.value)}>
            <option value="member">學員</option>
            <option value="trial">體驗課學員</option>
          </select>
        </label>
        <label>
          姓名
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如:王小明" required />
        </label>
        {isStaff && (
          <label>
            所屬教練
            <select value={coachId} onChange={(e) => setCoachId(e.target.value)} required>
              <option value="">請選擇教練</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {memberType === "member" && (
        <label className="block-label">
          聯絡電話
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="選填" />
        </label>
      )}

      {memberType === "trial" && (
        <div className="trial-fields">
          <label className="block-label">
            體驗課日期
            <div className="date-time-wrap">
              <input type="date" value={trialDate} onChange={(e) => setTrialDate(e.target.value)} required />
            </div>
          </label>
          <label className="block-label">
            體驗課時間
            <div className="date-time-wrap">
              <input type="time" value={trialTime} onChange={(e) => setTrialTime(e.target.value)} min="08:00" max="23:00" required />
            </div>
          </label>
          <div className="trial-fields-row">
            <label className="block-label">
              體驗課課費
              <input type="number" min={0} value={trialFee} onChange={(e) => setTrialFee(e.target.value)} placeholder="選填" />
            </label>
            <label className="block-label">
              付款帳號末五碼
              <input type="text" maxLength={5} value={trialPaymentLast5} onChange={(e) => setTrialPaymentLast5(e.target.value)} placeholder="選填" />
            </label>
          </div>
          <label className="block-label">
            訓練目的
            <input type="text" value={trialGoal} onChange={(e) => setTrialGoal(e.target.value)} placeholder="例如:減脂、增肌、體態調整" />
          </label>
          <label className="block-label">
            身體狀況(家族病史/舊傷/痠痛等)
            <textarea rows={2} value={trialHealth} onChange={(e) => setTrialHealth(e.target.value)} />
          </label>
        </div>
      )}

      <button type="submit" className="btn-primary full">
        新增{memberType === "member" ? "學員" : "體驗課學員"}
      </button>
    </form>
  );
}

/* ============================================================
   購課 Modal
   ============================================================ */
function PurchaseModal({ member, onClose, onPurchase }) {
  const [sessionsAdded, setSessionsAdded] = useState(10);
  const [pricePerSession, setPricePerSession] = useState(member.price_per_session || "");
  const [purchaseDate, setPurchaseDate] = useState(todayStr());

  // 金額固定為「購買堂數 × 本次單堂課金額」,不再提供手動覆寫的實收金額欄位
  const calcAmount = sessionsAdded && pricePerSession
    ? Number(sessionsAdded) * Number(pricePerSession)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onPurchase(
      member.id,
      Number(sessionsAdded),
      calcAmount,
      pricePerSession !== "" ? Number(pricePerSession) : null,
      purchaseDate,
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{member.name} — 購課</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form-card">
          <label>
            購買堂數
            <input type="number" min={1} value={sessionsAdded} onChange={(e) => setSessionsAdded(e.target.value)} required />
          </label>
          <label>
            本次單堂課金額(元)
            <input
              type="number"
              min={0}
              value={pricePerSession}
              onChange={(e) => setPricePerSession(e.target.value)}
              placeholder={`上次 $${member.price_per_session || 0}`}
            />
          </label>
          <label>
            購課日期
            <div className="date-time-wrap">
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
          </label>
          <p className="modal-hint">
            總堂數 {member.total_sessions} → 加購後 {member.total_sessions + Number(sessionsAdded || 0)}
            {pricePerSession !== "" && ` · 本次單堂金額將更新為 $${Number(pricePerSession).toLocaleString()}`}
            {calcAmount > 0 && ` · 課程金額 $${calcAmount.toLocaleString()}`}
          </p>
          <p className="modal-hint">不會自動建立繳款紀錄,如需收款請至「繳款」分頁手動新增。</p>
          <button type="submit" className="btn-primary full">
            確認購課
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   學員詳情 Modal(一般學員)
   ============================================================ */
const MEMBER_DETAIL_TABS = [
  { key: "profile", label: "基本資料" },
  { key: "body", label: "Inbody / 體態" },
  { key: "payment", label: "繳款" },
  { key: "charges", label: "手動調整" },
  { key: "history", label: "訓練紀錄" },
];

function MemberDetailModal({
  member,
  sessions,
  payments,
  bodyRecords,
  manualCharges,
  periodRecords,
  memberPhotos,
  purchaseRecords,
  onClose,
  onUpdateMember,
  onDeleteMember,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onAddBodyRecord,
  onUpdateBodyRecord,
  onUploadFile,
  onAddManualCharge,
  onDeleteManualCharge,
  onAddPeriodRecord,
  onDeletePeriodRecord,
  onAddMemberPhoto,
  onDeleteMemberPhoto,
  onUpdateMemberPhoto,
  onDeletePurchaseRecord,
  onOpenSession,
}) {
  const [tab, setTab] = useState("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(member.name);

  useEffect(() => {
    setNameDraft(member.name);
  }, [member.name]);

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== member.name) {
      await onUpdateMember(member.id, { name: trimmed });
    }
    setEditingName(false);
  };

  const completedSessions = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => (b.session_date + b.start_time).localeCompare(a.session_date + a.start_time));

  const totalPaid = payments.filter((p) => p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  // 課費總金額:逐筆購課紀錄加總(每次購課堂數 × 該次單堂金額),而非「目前總堂數 × 目前單堂金額」,
  // 因為每次購課的單價可能不同(例如第一次 10 堂 $2500、加購 50 堂 $2000、再加購 20 堂 $1800)
  const totalCourseFee = (purchaseRecords || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  // 未完成課費 = 剩餘堂數 × 最新一次購課的單堂金額(member.price_per_session 會在每次購課時更新為最新單價)
  const remainingSessions = Math.max(member.total_sessions - member.used_sessions, 0);
  const unfinishedFee = remainingSessions * (member.price_per_session || 0);
  // 手動調整總金額:扣費為正、退費為負,加總後可能為正(需多收)或負(需退款)
  const manualAdjustTotal = (manualCharges || []).reduce((sum, c) => sum + Number(c.amount || 0), 0);
  // 總金額 = 課程總金額 + 手動調整總金額(退費時會讓總金額下降)
  const grandTotal = totalCourseFee + manualAdjustTotal;
  // 剩餘未付 = 總金額(課費+手動調整) - 已收金額
  const remainingUnpaid = Math.max(grandTotal - totalPaid, totalDue + manualAdjustTotal - totalPaid, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="member-name-edit-wrap">
            {editingName ? (
              <div className="member-name-edit-row">
                <input
                  type="text"
                  className="member-name-edit-input"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  autoFocus
                />
                <button type="button" className="icon-btn" onClick={saveName} title="儲存">
                  <CheckCircle2 size={18} />
                </button>
                <button type="button" className="icon-btn" onClick={() => { setNameDraft(member.name); setEditingName(false); }} title="取消">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <h3 onClick={() => setEditingName(true)} className="member-name-edit-trigger" title="點擊編輯姓名">
                {member.name}
                <Pencil size={14} className="member-name-edit-icon" />
              </h3>
            )}
            <p className="modal-sub">
              {member.phone || "尚未填寫電話"}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          {MEMBER_DETAIL_TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === "profile" && (
            <ProfileTab
              member={member}
              periodRecords={periodRecords || []}
              memberPhotos={(memberPhotos || []).filter((p) => p.photo_type === "contract")}
              purchaseRecords={(purchaseRecords || []).filter((r) => r.member_id === member.id)}
              onUpdateMember={onUpdateMember}
              onAddPeriodRecord={onAddPeriodRecord}
              onDeletePeriodRecord={onDeletePeriodRecord}
              onAddMemberPhoto={(payload) => onAddMemberPhoto(member.id, { ...payload, photo_type: "contract" })}
              onDeleteMemberPhoto={onDeleteMemberPhoto}
              onUpdateMemberPhoto={onUpdateMemberPhoto}
              onDeletePurchaseRecord={onDeletePurchaseRecord}
            />
          )}

          {tab === "body" && (
            <BodyTab
              member={member}
              memberPhotos={(memberPhotos || []).filter((p) => p.photo_type === "body")}
              onUpdateMember={onUpdateMember}
              onAddMemberPhoto={(payload) => onAddMemberPhoto(member.id, { ...payload, photo_type: "body" })}
              onDeleteMemberPhoto={onDeleteMemberPhoto}
              onUpdateMemberPhoto={onUpdateMemberPhoto}
            />
          )}

          {tab === "payment" && (
            <PaymentTab
              member={member}
              payments={payments}
              totalPaid={totalPaid}
              totalCourseFee={totalCourseFee}
              manualAdjustTotal={manualAdjustTotal}
              grandTotal={grandTotal}
              unfinishedFee={unfinishedFee}
              remainingUnpaid={remainingUnpaid}
              onAddPayment={onAddPayment}
              onUpdatePayment={onUpdatePayment}
              onDeletePayment={onDeletePayment}
            />
          )}

          {tab === "charges" && (
            <ManualChargesTab
              member={member}
              manualCharges={manualCharges || []}
              onAddManualCharge={onAddManualCharge}
              onDeleteManualCharge={onDeleteManualCharge}
            />
          )}

          {tab === "history" && (
            <div className="section">
              {completedSessions.length === 0 ? (
                <div className="empty-block">尚無已完成的課堂紀錄。</div>
              ) : (
                <div className="list">
                  {completedSessions.map((s) => (
                    <div
                      className="history-row clickable"
                      key={s.id}
                      onClick={() => onOpenSession && onOpenSession(s)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="history-row-head">
                        <span className="list-row-title">
                          {fmtDate(s.session_date)} · {s.start_time} · {s.duration_min} 分鐘
                          {s.location ? ` · ${s.location}` : ""}
                        </span>
                        <div className="history-stars">
                          {s.energy_rating ? (
                            <span className="mini-star" title="體力感">
                              <Star size={13} fill="currentColor" /> {s.energy_rating}
                            </span>
                          ) : null}
                          <ChevronRight size={16} className="row-arrow" />
                        </div>
                      </div>
                      {s.warmup && <p className="history-content"><strong>熱身:</strong>{s.warmup}</p>}
                      {s.main_training && <p className="history-content"><strong>主訓練:</strong>{s.main_training}</p>}
                      {s.cooldown && <p className="history-content"><strong>收操:</strong>{s.cooldown}</p>}
                      {s.coach_notes && <p className="history-content"><strong>教練筆記:</strong>{s.coach_notes}</p>}
                      {s.member_feedback && <p className="history-content"><strong>學員回饋:</strong>{s.member_feedback}</p>}
                      {(s.energy_rating || s.soreness_rating || s.mood_rating) && (
                        <p className="history-content muted">
                          體力感 {s.energy_rating || "-"} ・ 痠痛感 {s.soreness_rating || "-"} ・ 心情 {s.mood_rating || "-"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!confirmDelete ? (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> 刪除學員
            </button>
          ) : (
            <div className="confirm-delete">
              <span>確定要刪除此學員及其所有紀錄?</span>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>取消</button>
              <button
                className="btn-danger"
                onClick={async () => {
                  await onDeleteMember(member.id);
                  onClose();
                }}
              >
                確認刪除
              </button>
            </div>
          )}
          <div className="spacer" />
          <button className="btn-primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 基本資料 Tab ---------- */
function ProfileTab({ member, periodRecords, memberPhotos, purchaseRecords, onUpdateMember, onAddPeriodRecord, onDeletePeriodRecord, onAddMemberPhoto, onDeleteMemberPhoto, onUpdateMemberPhoto, onDeletePurchaseRecord }) {
  const [form, setForm] = useState({
    training_goal: member.training_goal || "",
    health_notes: member.health_notes || "",
    coach_notes: member.coach_notes || "",
    phone: member.phone || "",
    track_menstrual_cycle: member.track_menstrual_cycle || false,
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [newPeriodDate, setNewPeriodDate] = useState(todayStr());

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await onUpdateMember(member.id, {
      training_goal: form.training_goal,
      health_notes: form.health_notes,
      coach_notes: form.coach_notes,
      phone: form.phone,
      track_menstrual_cycle: form.track_menstrual_cycle,
    });
    setSaving(false);
    setSavedAt(Date.now());
  };

  const sortedPurchases = (purchaseRecords || []).slice().sort((a, b) => b.purchase_date.localeCompare(a.purchase_date));

  const sortedPeriods = (periodRecords || []).slice().sort((a, b) => b.period_date.localeCompare(a.period_date));

  // 平均週期天數(與 App 載入時的計算邏輯一致,僅供顯示參考)
  const avgCycle = useMemo(() => {
    if (sortedPeriods.length < 2) return null;
    const asc = sortedPeriods.slice().sort((a, b) => a.period_date.localeCompare(b.period_date));
    const diffs = [];
    for (let i = 1; i < asc.length; i++) diffs.push(daysBetween(asc[i - 1].period_date, asc[i].period_date));
    return Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
  }, [sortedPeriods]);

  const handleAddPeriod = async () => {
    if (!newPeriodDate) return;
    await onAddPeriodRecord(member.id, { period_date: newPeriodDate });
    setNewPeriodDate(todayStr());
  };

  return (
    <div className="section">
      <label className="block-label">
        聯絡電話
        <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      </label>

      <label className="block-label">
        訓練目的 / 方向
        <textarea rows={2} value={form.training_goal} onChange={(e) => update("training_goal", e.target.value)} placeholder="例如:減脂、增肌、體態雕塑、運動表現提升" />
      </label>

      <label className="block-label">
        身體狀況(家族病史 / 舊傷 / 痠痛等反應)
        <textarea rows={3} value={form.health_notes} onChange={(e) => update("health_notes", e.target.value)} />
      </label>

      <div className="divider" />

      <h4 className="section-title-sm">購課紀錄</h4>
      {sortedPurchases.length === 0 ? (
        <div className="empty-block small">尚無購課紀錄,於「購課」按鈕新增後會自動顯示在這裡。</div>
      ) : (
        <div className="list">
          {sortedPurchases.map((r) => (
            <div className="list-row" key={r.id}>
              <div className="list-row-main">
                <span className="list-row-title">{fmtDate(r.purchase_date)} · 購買 {r.sessions_added} 堂</span>
                <span className="list-row-sub">
                  單堂金額 {fmtMoney(r.price_per_session)} · 共 {fmtMoney(r.amount)}
                </span>
              </div>
              {onDeletePurchaseRecord && (
                <button type="button" className="icon-btn" onClick={() => onDeletePurchaseRecord(r.id)} title="刪除此筆購課紀錄(僅刪除紀錄,不會自動調整堂數)">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="divider" />

      <h4 className="section-title-sm">生理週期紀錄(女學員)</h4>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.track_menstrual_cycle} onChange={(e) => update("track_menstrual_cycle", e.target.checked)} />
        追蹤生理週期(經期前3天會在總覽提醒教練調整訓練)
      </label>

      {form.track_menstrual_cycle && (
        <>
          {avgCycle && (
            <div className="hint-box">
              依據 {sortedPeriods.length} 筆歷史紀錄,自動計算平均週期約為 <strong>{avgCycle} 天</strong>。
            </div>
          )}
          <div className="trial-fields-row">
            <label className="block-label">
              新增一次來潮日期
              <div className="date-time-wrap">
                <input type="date" value={newPeriodDate} onChange={(e) => setNewPeriodDate(e.target.value)} />
              </div>
            </label>
            <button type="button" className="btn-secondary" onClick={handleAddPeriod} style={{ alignSelf: "flex-end" }}>
              <Plus size={14} /> 新增紀錄
            </button>
          </div>

          {sortedPeriods.length === 0 ? (
            <div className="empty-block small">尚無月經週期歷史紀錄。</div>
          ) : (
            <div className="list">
              {sortedPeriods.map((r) => (
                <div className="list-row" key={r.id}>
                  <div className="list-row-main">
                    <span className="list-row-title">{fmtDate(r.period_date)}</span>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => onDeletePeriodRecord(r.id)} title="刪除">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="divider" />

      <h4 className="section-title-sm">學員合約照片(可上傳多張)</h4>
      <PhotoGallery
        photos={memberPhotos || []}
        onAddPhoto={onAddMemberPhoto}
        onDeletePhoto={onDeleteMemberPhoto}
        onUpdatePhoto={onUpdateMemberPhoto}
        emptyText="尚無合約照片。"
      />

      <div className="divider" />

      <label className="block-label">
        教練備註
        <textarea rows={2} value={form.coach_notes} onChange={(e) => update("coach_notes", e.target.value)} />
      </label>

      <div className="inline-form-row">
        <button type="button" className="btn-primary full" onClick={handleSave} disabled={saving}>
          {saving ? "儲存中…" : "儲存基本資料"}
        </button>
      </div>
      {savedAt > 0 && <p className="modal-hint">已儲存</p>}
    </div>
  );
}

/* ---------- Inbody / 體態 Tab ---------- */
function BodyTab({ member, memberPhotos, onUpdateMember, onAddMemberPhoto, onDeleteMemberPhoto, onUpdateMemberPhoto }) {
  const today = todayStr();
  const status = inbodyReminderStatus(member, today);

  const sorted = (memberPhotos || []).slice().sort((a, b) => (b.photo_date || "").localeCompare(a.photo_date || ""));

  // 新增照片後,順便更新 member.last_inbody_date 為最新一筆照片日期,讓提醒邏輯維持運作
  const handleAddPhoto = async (payload) => {
    await onAddMemberPhoto(payload);
    const latestDate = sorted.length > 0 && sorted[0].photo_date > payload.photo_date ? sorted[0].photo_date : payload.photo_date;
    if (!member.last_inbody_date || latestDate >= member.last_inbody_date) {
      await onUpdateMember(member.id, { last_inbody_date: latestDate });
    }
  };

  return (
    <div className="section">
      <div className="form-grid">
        <label>
          記錄週期(天)
          <input
            type="number"
            min={7}
            max={90}
            value={member.inbody_interval_days || 30}
            onChange={(e) => onUpdateMember(member.id, { inbody_interval_days: Number(e.target.value) })}
          />
        </label>
        <label>
          最近一次記錄日期
          <input type="date" value={member.last_inbody_date || ""} readOnly />
        </label>
      </div>

      {status && (
        <div className="hint-box warn">
          {status === "due" ? "已到期或從未記錄,請拍攝最新 Inbody 與體態照。" : "即將到期(3天內),建議安排拍攝。"}
          {member.track_menstrual_cycle && menstrualReminderStatus(member, today) && "(因生理期已自動順延 7 天計算)"}
        </div>
      )}

      <h4 className="section-title-sm">Inbody / 體態照(可上傳多張,各自設定日期)</h4>
      <PhotoGallery
        photos={sorted}
        onAddPhoto={handleAddPhoto}
        onDeletePhoto={onDeleteMemberPhoto}
        onUpdatePhoto={onUpdateMemberPhoto}
        emptyText="尚無 Inbody / 體態照紀錄。"
      />
    </div>
  );
}


/* ---------- 繳款 Tab ---------- */
const PAYMENT_METHODS = ["現金", "Line Pay", "轉帳"];

function PaymentTab({ member, payments, totalPaid, totalCourseFee, manualAdjustTotal, grandTotal, unfinishedFee, remainingUnpaid, onAddPayment, onUpdatePayment, onDeletePayment }) {
  const [showForm, setShowForm] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  const sorted = payments.slice().sort((a, b) => (a.installment_no || 0) - (b.installment_no || 0) || (a.due_date || "").localeCompare(b.due_date || ""));

  // 預覽:依「總金額」與「期數」自動整除,無法整除的餘數會加在第一期
  const previewInstallments = useMemo(() => {
    const total = Number(totalAmount) || 0;
    const count = Math.max(Number(installmentCount) || 1, 1);
    if (total <= 0) return [];
    const base = Math.floor(total / count);
    const remainder = total - base * count;
    return Array.from({ length: count }, (_, i) => ({
      no: i + 1,
      amount: i === 0 ? base + remainder : base,
      due_date: dateStrAdd(firstDueDate, i * 30), // 每期間隔約一個月(30天)
    }));
  }, [totalAmount, installmentCount, firstDueDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (previewInstallments.length === 0) return;
    for (const inst of previewInstallments) {
      await onAddPayment(member.id, {
        amount: inst.amount,
        due_date: inst.due_date,
        payment_method: "",
        installment_no: inst.no,
        installment_total: previewInstallments.length,
        note: note.trim(),
        is_paid: false,
      });
    }
    setTotalAmount("");
    setInstallmentCount(1);
    setFirstDueDate(todayStr());
    setNote("");
    setShowForm(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditAmount(String(p.amount));
  };

  const saveEdit = async (p) => {
    await onUpdatePayment(p.id, { amount: Number(editAmount) || 0 });
    setEditingId(null);
  };

  return (
    <div className="section">
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">課費總金額</span>
          <span className="stat-value">{fmtMoney(totalCourseFee)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">未完成課費</span>
          <span className="stat-value">{fmtMoney(unfinishedFee)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">手動調整總金額</span>
          <span className={`stat-value ${manualAdjustTotal < 0 ? "warn" : manualAdjustTotal > 0 ? "accent" : ""}`}>
            {manualAdjustTotal >= 0 ? fmtMoney(manualAdjustTotal) : `- ${fmtMoney(Math.abs(manualAdjustTotal))}`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">總金額</span>
          <span className="stat-value">{fmtMoney(grandTotal)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">已收金額</span>
          <span className="stat-value accent">{fmtMoney(totalPaid)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">剩餘未付</span>
          <span className={`stat-value ${remainingUnpaid > 0 ? "warn" : ""}`}>{fmtMoney(remainingUnpaid)}</span>
        </div>
      </div>

      <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
        {showForm ? <X size={16} /> : <Plus size={16} />}
        {showForm ? "取消" : "新增分期/付款紀錄"}
      </button>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              總金額(元)
              <input type="number" min={0} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
            </label>
            <label>
              分期期數
              <input type="number" min={1} max={36} value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} required />
            </label>
            <label>
              第一期應付款日期
              <div className="date-time-wrap">
                <input type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} required />
              </div>
            </label>
          </div>
          <label className="block-label">
            備註(選填)
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如:首次購課、續約優惠等" />
          </label>

          {previewInstallments.length > 0 && (
            <div className="hint-box">
              {installmentCount > 1 ? "將自動整除,無法整除的餘數會加到第一期:" : "將建立 1 筆付款紀錄:"}
              <div className="list" style={{ marginTop: 8 }}>
                {previewInstallments.map((inst) => (
                  <div className="payment-record-row" key={inst.no}>
                    <span>第 {inst.no}/{previewInstallments.length} 期 · 應付日 {fmtDate(inst.due_date)}</span>
                    <span className="payment-amount">{fmtMoney(inst.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary full" disabled={previewInstallments.length === 0}>
            新增
          </button>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="empty-block">尚無分期/付款紀錄。</div>
      ) : (
        <div className="list">
          {sorted.map((p) => (
            <PaymentRow
              key={p.id}
              payment={p}
              editing={editingId === p.id}
              editAmount={editAmount}
              onStartEdit={() => startEdit(p)}
              onEditAmountChange={setEditAmount}
              onSaveEdit={() => saveEdit(p)}
              onCancelEdit={() => setEditingId(null)}
              onUpdatePayment={onUpdatePayment}
              onDeletePayment={onDeletePayment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 單筆繳款紀錄列(含付款方式 + 已結清切換) ---------- */
function PaymentRow({ payment: p, editing, editAmount, onStartEdit, onEditAmountChange, onSaveEdit, onCancelEdit, onUpdatePayment, onDeletePayment }) {
  const [bankLast5, setBankLast5] = useState(p.bank_last5 || "");

  const handleMethodChange = async (newMethod) => {
    const updates = { payment_method: newMethod };
    if (newMethod !== "轉帳") {
      updates.bank_last5 = "";
      setBankLast5("");
    }
    await onUpdatePayment(p.id, updates);
  };

  const handleBankLast5Blur = async () => {
    if (bankLast5 !== (p.bank_last5 || "")) {
      await onUpdatePayment(p.id, { bank_last5: bankLast5 });
    }
  };

  return (
    <div className="payment-row">
      <div className="list-row-main">
        <span className="list-row-title">
          第 {p.installment_no}/{p.installment_total} 期 ·{" "}
          {editing ? (
            <span className="payment-edit-amount-row">
              <input
                type="number"
                min={0}
                className="payment-edit-amount-input"
                value={editAmount}
                onChange={(e) => onEditAmountChange(e.target.value)}
                autoFocus
              />
              <button type="button" className="icon-btn" onClick={onSaveEdit} title="儲存">
                <CheckCircle2 size={15} />
              </button>
              <button type="button" className="icon-btn" onClick={onCancelEdit} title="取消">
                <X size={15} />
              </button>
            </span>
          ) : (
            <span className="payment-amount-trigger" onClick={onStartEdit} title="點擊編輯金額">
              {fmtMoney(p.amount)}
              <Pencil size={12} className="member-name-edit-icon" />
            </span>
          )}
        </span>
        <span className="list-row-sub">
          應付日:{fmtDate(p.due_date)}
          {p.note ? ` · ${p.note}` : ""}
          {p.is_paid && p.paid_date ? ` · 已付於 ${fmtDate(p.paid_date)}` : ""}
        </span>
      </div>
      <div className="payment-row-actions payment-row-actions-wrap">
        <select
          className="payment-method-select"
          value={p.payment_method || ""}
          onChange={(e) => handleMethodChange(e.target.value)}
        >
          <option value="">付款方式</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {p.payment_method === "轉帳" && (
          <input
            type="text"
            maxLength={5}
            className="payment-bank-last5-input"
            placeholder="帳號末五碼"
            value={bankLast5}
            onChange={(e) => setBankLast5(e.target.value)}
            onBlur={handleBankLast5Blur}
          />
        )}
        <label className="checkbox-row inline">
          <input
            type="checkbox"
            checked={p.is_paid}
            onChange={(e) =>
              onUpdatePayment(p.id, {
                is_paid: e.target.checked,
                paid_date: e.target.checked ? todayStr() : null,
              })
            }
          />
          已結清
        </label>
        <button className="icon-btn" onClick={() => onDeletePayment(p.id)} title="刪除">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   手動調整 Tab(可扣費/退費,可扣除/加回堂數)
   ============================================================ */
function ManualChargesTab({ member, manualCharges, onAddManualCharge, onDeleteManualCharge }) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [amountType, setAmountType] = useState("charge"); // charge = 扣費, refund = 退費
  const [amount, setAmount] = useState("");
  const [sessionsType, setSessionsType] = useState("deduct"); // deduct = 扣除堂數, add = 加回堂數
  const [sessionsCount, setSessionsCount] = useState("");
  const [note, setNote] = useState("");
  const [chargeDate, setChargeDate] = useState(todayStr());
  const [error, setError] = useState("");

  const sorted = manualCharges.slice().sort((a, b) => (b.charge_date || "").localeCompare(a.charge_date || ""));
  // amount/sessions_deducted 為帶正負號的數值:正值=扣費/扣堂,負值=退費/加堂
  const totalCharged = manualCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalSessionsDeducted = manualCharges.reduce((sum, c) => sum + Number(c.sessions_deducted || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const amountAbs = Number(amount) || 0;
    const sessionsAbs = Number(sessionsCount) || 0;
    if (amountAbs <= 0 && sessionsAbs <= 0) {
      setError("請至少填寫金額或堂數其中一項");
      return;
    }
    const signedAmount = amountType === "refund" ? -amountAbs : amountAbs;
    const signedSessions = sessionsType === "add" ? -sessionsAbs : sessionsAbs;

    if (signedSessions > 0 && member.member_type === "member") {
      const remaining = Math.max(member.total_sessions - member.used_sessions, 0);
      if (signedSessions > remaining) {
        setError(`此學員剩餘堂數不足(剩餘 ${remaining} 堂),無法扣除 ${signedSessions} 堂`);
        return;
      }
    }
    await onAddManualCharge(member.id, {
      label: label.trim(),
      amount: signedAmount,
      sessions_deducted: signedSessions,
      charge_date: chargeDate,
      note: note.trim(),
    });
    setLabel(""); setAmount(""); setSessionsCount(""); setNote(""); setChargeDate(todayStr());
    setAmountType("charge"); setSessionsType("deduct");
    setShowForm(false);
  };

  return (
    <div className="section">
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">累計手動調整金額</span>
          <span className={`stat-value ${totalCharged < 0 ? "warn" : totalCharged > 0 ? "accent" : ""}`}>
            {totalCharged >= 0 ? fmtMoney(totalCharged) : `- ${fmtMoney(Math.abs(totalCharged))}`}
          </span>
        </div>
        {totalSessionsDeducted !== 0 && (
          <div className="stat-card">
            <span className="stat-label">累計手動調整堂數</span>
            <span className={`stat-value ${totalSessionsDeducted >= 0 ? "warn" : "accent"}`}>
              {totalSessionsDeducted >= 0 ? `扣除 ${totalSessionsDeducted} 堂` : `加回 ${Math.abs(totalSessionsDeducted)} 堂`}
            </span>
          </div>
        )}
      </div>

      <div className="hint-box">
        此處用於記錄不透過正常排課/購課流程的金額或堂數調整,例如：臨時取消的場地費、額外服務費、遲到費、課程退費,或單純手動增減課程總堂數。金額可選擇「扣費」或「退費」,堂數可選擇「扣除」或「加回」,兩者各自獨立,不需要同時填。堂數調整影響的是學員的「剩餘總堂數」,不會更動已完成的已用堂數紀錄。
      </div>

      <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
        {showForm ? <X size={16} /> : <Plus size={16} />}
        {showForm ? "取消" : "新增手動調整"}
      </button>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <label className="block-label">
            項目名稱
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如:場地費、遲到費、臨時取消費、課程退費"
              required
            />
          </label>

          <label className="block-label">
            金額(選填)
          </label>
          <div className="manual-adjust-row">
            <div className="manual-adjust-toggle">
              <button
                type="button"
                className={`manual-adjust-toggle-btn ${amountType === "charge" ? "active warn" : ""}`}
                onClick={() => setAmountType("charge")}
              >
                扣費
              </button>
              <button
                type="button"
                className={`manual-adjust-toggle-btn ${amountType === "refund" ? "active accent" : ""}`}
                onClick={() => setAmountType("refund")}
              >
                退費
              </button>
            </div>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>

          <label className="block-label">
            堂數(選填)
          </label>
          <div className="manual-adjust-row">
            <div className="manual-adjust-toggle">
              <button
                type="button"
                className={`manual-adjust-toggle-btn ${sessionsType === "deduct" ? "active warn" : ""}`}
                onClick={() => setSessionsType("deduct")}
              >
                扣除堂數
              </button>
              <button
                type="button"
                className={`manual-adjust-toggle-btn ${sessionsType === "add" ? "active accent" : ""}`}
                onClick={() => setSessionsType("add")}
              >
                加回堂數
              </button>
            </div>
            <input type="number" min={0} value={sessionsCount} onChange={(e) => setSessionsCount(e.target.value)} placeholder="0" />
          </div>

          <label className="block-label">
            日期
            <div className="date-time-wrap">
              <input type="date" value={chargeDate} onChange={(e) => setChargeDate(e.target.value)} required />
            </div>
          </label>
          <label className="block-label">
            備註(選填)
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如:6/15 臨時取消課程" />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-primary full">新增</button>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="empty-block">尚無手動調整紀錄。</div>
      ) : (
        <div className="list">
          {sorted.map((c) => {
            const amt = Number(c.amount || 0);
            const sess = Number(c.sessions_deducted || 0);
            return (
              <div className="payment-row" key={c.id}>
                <div className="list-row-main">
                  <span className="list-row-title">{c.label || "手動調整"}</span>
                  <span className="list-row-sub">
                    {fmtDate(c.charge_date)}
                    {amt !== 0 ? ` · ${amt > 0 ? "扣費" : "退費"} ${fmtMoney(Math.abs(amt))}` : ""}
                    {sess !== 0 ? ` · ${sess > 0 ? "扣除" : "加回"} ${Math.abs(sess)} 堂` : ""}
                    {c.note ? ` · ${c.note}` : ""}
                  </span>
                </div>
                <button className="icon-btn" onClick={() => onDeleteManualCharge(c.id)} title="刪除">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   體驗課學員詳情 Modal
   ============================================================ */
function TrialDetailModal({ member, sessions, onClose, onUpdateMember, onDeleteMember, onConvert }) {
  const [form, setForm] = useState({
    training_goal: member.training_goal || "",
    trial_fee: member.trial_fee || 0,
    trial_payment_last5: member.trial_payment_last5 || "",
    health_notes: member.health_notes || "",
    trial_interaction_notes: member.trial_interaction_notes || "",
    trial_followup_status: member.trial_followup_status || "pending",
    trial_followup_reason: member.trial_followup_reason || "",
  });
  const [saving, setSaving] = useState(false);
  const [convertForm, setConvertForm] = useState({
    total_sessions: 10,
    price_per_session: "",
  });
  // 後續追蹤的兩個選項互斥:converted = 顯示「轉為正式學員」表單,
  // pending = 顯示追蹤備註。預設為 pending。
  const [followupChoice, setFollowupChoice] = useState("pending");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(member.name);

  useEffect(() => {
    setNameDraft(member.name);
  }, [member.name]);

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== member.name) {
      await onUpdateMember(member.id, { name: trimmed });
    }
    setEditingName(false);
  };

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await onUpdateMember(member.id, { ...form, trial_fee: Number(form.trial_fee) || 0 });
    setSaving(false);
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    await onUpdateMember(member.id, {
      member_type: "member",
      trial_followup_status: "converted",
      converted_at: new Date().toISOString(),
    });
    onClose();
  };

  const session = sessions[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="member-name-edit-wrap">
            {editingName ? (
              <div className="member-name-edit-row">
                <input
                  type="text"
                  className="member-name-edit-input"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  autoFocus
                />
                <button type="button" className="icon-btn" onClick={saveName} title="儲存">
                  <CheckCircle2 size={18} />
                </button>
                <button type="button" className="icon-btn" onClick={() => { setNameDraft(member.name); setEditingName(false); }} title="取消">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <h3 onClick={() => setEditingName(true)} className="member-name-edit-trigger" title="點擊編輯姓名">
                {member.name}(體驗課)
                <Pencil size={14} className="member-name-edit-icon" />
              </h3>
            )}
            <p className="modal-sub">
              <span className="pill pill-trial">體驗課</span>
              {member.trial_session_date ? ` ${fmtDate(member.trial_session_date)} ${member.trial_start_time || ""}` : " 尚未排課"}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <label className="block-label">
            訓練目的
            <textarea rows={2} value={form.training_goal} onChange={(e) => update("training_goal", e.target.value)} />
          </label>

          <label className="block-label">
            付款帳號末五碼
            <input type="text" maxLength={5} value={form.trial_payment_last5} onChange={(e) => update("trial_payment_last5", e.target.value)} />
          </label>

          <label className="block-label">
            體驗課課費
            <input type="number" min={0} value={form.trial_fee} onChange={(e) => update("trial_fee", e.target.value)} />
          </label>

          <label className="block-label">
            身體狀況(家族病史 / 舊傷 / 痠痛等反應)
            <textarea rows={3} value={form.health_notes} onChange={(e) => update("health_notes", e.target.value)} />
          </label>

          <div className="divider" />

          <label className="block-label">
            體驗課互動狀況(完課後補充)
            <textarea rows={3} value={form.trial_interaction_notes} onChange={(e) => update("trial_interaction_notes", e.target.value)} placeholder="學員上課互動、反應、興趣程度等" />
          </label>

          {session?.status === "completed" && (
            <div className="hint-box">
              本次體驗課已完成
              {session.main_training ? `,主訓練內容:${session.main_training}` : ""}
            </div>
          )}

          <div className="divider" />

          <h4 className="section-title-sm">後續追蹤</h4>
          <div className="followup-options">
            <button
              type="button"
              className={`followup-btn ${followupChoice === "converted" ? "active success" : "dimmed"}`}
              onClick={() => setFollowupChoice("converted")}
            >
              <ArrowRightCircle size={16} /> 轉為正式學員
            </button>
            <button
              type="button"
              className={`followup-btn ${followupChoice === "pending" ? "active" : "dimmed"}`}
              onClick={() => {
                setFollowupChoice("pending");
                update("trial_followup_status", "pending");
              }}
            >
              <Clock size={16} /> 暫未簽約,持續追蹤
            </button>
          </div>

          {followupChoice === "pending" && (
            <label className="block-label">
              追蹤備註(選填)
              <textarea rows={2} value={form.trial_followup_reason} onChange={(e) => update("trial_followup_reason", e.target.value)} placeholder="例如:考慮中、價格猶豫、近期再聯絡等" />
            </label>
          )}

          {followupChoice === "converted" && (
            <form className="card form-card" onSubmit={handleConvert}>
              <h4 className="section-title-sm">轉為正式學員</h4>
              <div className="form-grid">
              <button type="submit" className="btn-primary full">
                確認轉換
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          {!confirmDelete ? (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> 刪除
            </button>
          ) : (
            <div className="confirm-delete">
              <span>確定刪除此體驗課學員?</span>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>取消</button>
              <button
                className="btn-danger"
                onClick={async () => {
                  await onDeleteMember(member.id);
                  onClose();
                }}
              >
                確認刪除
              </button>
            </div>
          )}
          <div className="spacer" />
          <button className="btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? "儲存中…" : "儲存"}
          </button>
          <button className="btn-primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   行事曆檢視(週曆)+ 不可排課時段設定
   ============================================================ */
const WEEKDAY_LABELS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
const CAL_START_HOUR = 8; // 行事曆顯示起始時間(系統限制 08:00 前不可排課)
const CAL_END_HOUR = 23; // 行事曆顯示結束時間(不含,系統限制 23:00 後不可排課)
const CAL_HOUR_HEIGHT = 56; // 每小時的像素高度

function CalendarView({ members, sessions, blockedTimes, isStaff, currentCoachId, coaches, onOpenSession, onAddBlockedTime, onUpdateBlockedTime, onDeleteBlockedTime, searchQuery, onSearchChange }) {
  const [anchorDate, setAnchorDate] = useState(() => {
    const t = todayStr();
    const wd = weekdayOf(t);
    return dateStrAdd(t, -wd); // 本週週日
  });
  const viewDays = 7; // 固定七日檢視
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [filterCoachId, setFilterCoachId] = useState(isStaff ? "" : currentCoachId);

  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  // 七日檢視時,從週日開始對齊;三日/單日檢視時,直接以 anchorDate 為起點往後排
  const rangeStart = useMemo(() => {
    const wd = weekdayOf(anchorDate);
    return dateStrAdd(anchorDate, -wd);
  }, [anchorDate]);

  const rangeDates = useMemo(() => {
    return Array.from({ length: viewDays }, (_, i) => dateStrAdd(rangeStart, i));
  }, [rangeStart]);

  const today = todayStr();

  // 篩選後的課堂(依教練篩選,小編可選擇查看哪位教練;另可依學員姓名搜尋)
  // 包含「排定中」與「已完成」的課堂,讓行事曆能完整呈現實際上課狀況
  const visibleSessions = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return sessions.filter((s) => {
      if (s.status === "cancelled") return false;
      if (filterCoachId && s.coach_id !== filterCoachId) return false;
      if (q) {
        const m = memberMap[s.member_id];
        if (!(m?.name || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sessions, filterCoachId, searchQuery, memberMap]);

  const visibleBlockedTimes = useMemo(() => {
    return (blockedTimes || []).filter((b) => !filterCoachId || b.coach_id === filterCoachId);
  }, [blockedTimes, filterCoachId]);

  const hours = Array.from({ length: CAL_END_HOUR - CAL_START_HOUR }, (_, i) => CAL_START_HOUR + i);

  const blockTop = (startTime) => {
    const mins = timeToMinutes(startTime) - CAL_START_HOUR * 60;
    return (mins / 60) * CAL_HOUR_HEIGHT;
  };
  const blockHeight = (durationMin) => Math.max((Number(durationMin) / 60) * CAL_HOUR_HEIGHT, 28);

  // 取得某一天的課堂與不可排課時段(依時間排序)
  const getDaySessions = (d) =>
    visibleSessions.filter((s) => s.session_date === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const getDayBlocks = (d) => {
    const wd = weekdayOf(d);
    return visibleBlockedTimes.filter(
      (b) => (b.block_date && b.block_date === d) || (b.weekday !== null && b.weekday !== undefined && Number(b.weekday) === wd)
    );
  };

  const rangeLabel = useMemo(() => {
    const first = rangeDates[0];
    const last = rangeDates[rangeDates.length - 1];
    return `${first.slice(0, 4)} 年 ${Number(first.slice(5, 7))} 月 ${Number(first.slice(8, 10))} 日 - ${Number(last.slice(8, 10))} 日`;
  }, [rangeDates, viewDays]);

  const stepBack = () => setAnchorDate((d) => dateStrAdd(d, -7));
  const stepForward = () => setAnchorDate((d) => dateStrAdd(d, 7));
  const goToday = () => {
    const t = todayStr();
    const wd = weekdayOf(t);
    setAnchorDate(dateStrAdd(t, -wd));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>行事曆</h1>
          <p className="page-sub">檢視排定的課堂與不可排課時段</p>
        </div>
        <button className="btn-primary" onClick={() => setShowBlockForm((v) => !v)}>
          {showBlockForm ? <X size={16} /> : <Plus size={16} />}
          {showBlockForm ? "取消" : "設定不可排課時段"}
        </button>
      </div>

      <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="搜尋學員姓名,顯示該學員的行事曆…" />

      {isStaff && (
        <label className="block-label">
          篩選教練
          <select value={filterCoachId} onChange={(e) => setFilterCoachId(e.target.value)}>
            <option value="">全部教練</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </label>
      )}

      {showBlockForm && (
        <BlockedTimeForm
          coaches={coaches}
          isStaff={isStaff}
          currentCoachId={currentCoachId}
          onAdd={async (payload) => {
            await onAddBlockedTime(payload);
            setShowBlockForm(false);
          }}
        />
      )}

      <div className="section">
        <div className="section-head">
          <CalendarDays size={18} />
          <h2>{rangeLabel}</h2>
        </div>

        <div className="cal-week-nav">
          <button className="icon-btn" onClick={stepBack}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn-secondary small" onClick={goToday}>
            本週
          </button>
          <button className="icon-btn" onClick={stepForward}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="cal-multiday-wrap">
          <div className="cal-multiday-scrollx">
            <div
              className="cal-multiday-grid"
              style={{ gridTemplateColumns: `48px repeat(${viewDays}, minmax(96px, 1fr))` }}
            >
              {/* 第一列:左上角空白 + 各天日期標籤(表頭,水平捲動時保持在頂端) */}
              <div className="cal-multiday-corner" />
              {rangeDates.map((d) => {
                const wd = weekdayOf(d);
                const isToday = d === today;
                return (
                  <div key={`h-${d}`} className={`cal-multiday-daylabel ${isToday ? "today" : ""}`}>
                    <span className="cal-day-weekday">{WEEKDAY_LABELS[wd]}</span>
                    <span className="cal-day-num">{Number(d.slice(8, 10))}</span>
                  </div>
                );
              })}

              {/* 第二列:時間刻度欄 + 每天一欄的時間軸內容,皆在同一個 grid 內,欄寬保證一致 */}
              <div className="cal-multiday-hourcol">
                {hours.map((h) => (
                  <div key={h} className="cal-hour-row" style={{ height: `${CAL_HOUR_HEIGHT}px` }}>
                    <span className="cal-hour-label">{pad2(h)}:00</span>
                  </div>
                ))}
              </div>

              {rangeDates.map((d) => {
                const dList = getDaySessions(d);
                const dBlocks = getDayBlocks(d);
                return (
                  <div key={d} className="cal-multiday-daycol" style={{ height: `${(CAL_END_HOUR - CAL_START_HOUR) * CAL_HOUR_HEIGHT}px` }}>
                    {hours.map((h) => (
                      <div key={h} className="cal-hour-row-line" style={{ height: `${CAL_HOUR_HEIGHT}px` }} />
                    ))}

                    {dBlocks.map((b, i) => {
                      const top = blockTop(b.start_time);
                      const height = Math.max(blockTop(b.end_time) - top, 20);
                      return (
                        <div
                          key={`block-${b.id || i}`}
                          className="cal-block cal-block-unavailable"
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          {b.label || "不可排課"} · {(b.start_time || "").slice(0, 5)}-{(b.end_time || "").slice(0, 5)}
                        </div>
                      );
                    })}

                    {dList.map((s) => {
                      const member = memberMap[s.member_id];
                      const isTrial = member?.member_type === "trial";
                      const isCompleted = s.status === "completed";
                      const top = blockTop(s.start_time);
                      const height = blockHeight(s.duration_min);
                      return (
                        <button
                          key={s.id}
                          className={`cal-block cal-block-session ${isTrial ? "trial" : "member"} ${isCompleted ? "completed" : ""}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          onClick={() => onOpenSession(s)}
                        >
                          <span className="cal-block-title">
                            {member?.name || "未知學員"}
                            {s.location ? ` · ${s.location}` : ""}
                            {isCompleted ? "(已完成)" : ""}
                          </span>
                          <span className="cal-block-time">{(s.start_time || "").slice(0, 5)} · {s.duration_min}分</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {visibleBlockedTimes.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Bell size={18} />
            <h2>已設定的不可排課時段</h2>
          </div>
          <div className="list">
            {visibleBlockedTimes.map((b) => (
              <BlockedTimeRow key={b.id} block={b} onUpdate={onUpdateBlockedTime} onDelete={onDeleteBlockedTime} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 不可排課時段設定表單 ---------- */
function BlockedTimeForm({ coaches, isStaff, currentCoachId, onAdd }) {
  const [mode, setMode] = useState("weekday"); // weekday(每週固定) | date(單次)
  const [weekday, setWeekday] = useState(0);
  const [blockDate, setBlockDate] = useState(todayStr());
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [label, setLabel] = useState("");
  const [coachId, setCoachId] = useState(currentCoachId || "");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (endTime <= startTime) {
      setError("結束時間必須晚於開始時間");
      return;
    }
    await onAdd({
      label: label.trim(),
      coach_id: coachId || currentCoachId,
      weekday: mode === "weekday" ? weekday : null,
      block_date: mode === "date" ? blockDate : null,
      start_time: startTime,
      end_time: endTime,
    });
    setLabel("");
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="trial-fields">
        <label className="block-label">
          名稱(選填)
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例如:固定休假、開會" />
        </label>

        <label className="block-label">
          類型
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="weekday">每週固定</option>
            <option value="date">單次日期</option>
          </select>
        </label>

        {mode === "weekday" ? (
          <label className="block-label">
            星期
            <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {WEEKDAY_LABELS.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block-label">
            日期
            <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} required />
          </label>
        )}

        <div className="trial-fields-row">
          <label className="block-label">
            開始時間
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
          <label className="block-label">
            結束時間
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </label>
        </div>

        {isStaff && (
          <label className="block-label">
            所屬教練
            <select value={coachId} onChange={(e) => setCoachId(e.target.value)} required>
              <option value="">請選擇教練</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && <div className="auth-error">{error}</div>}
      <button type="submit" className="btn-primary full">
        新增不可排課時段
      </button>
    </form>
  );
}

/* ---------- 可編輯的不可排課時段列項 ---------- */
function BlockedTimeRow({ block: b, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(b.label || "");
  const [startTime, setStartTime] = useState(b.start_time || "");
  const [endTime, setEndTime] = useState(b.end_time || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(b.id, { label: label.trim(), start_time: startTime, end_time: endTime });
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="list-row clickable" onClick={() => setEditing(true)}>
        <div className="list-row-main">
          <span className="list-row-title">
            {b.label || "不可排課"}
            {b.weekday !== null && b.weekday !== undefined
              ? <span className="pill pill-muted">每週{WEEKDAY_LABELS[b.weekday]}</span>
              : <span className="pill pill-muted">{fmtDate(b.block_date)}</span>}
          </span>
          <span className="list-row-sub">{(b.start_time || "").slice(0,5)} - {(b.end_time || "").slice(0,5)} · 點擊可編輯</span>
        </div>
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onDelete(b.id); }} title="刪除">
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="card form-card" style={{ gap: 10 }}>
      <label className="block-label">
        名稱
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="不可排課" />
      </label>
      <div className="form-grid">
        <label>
          開始時間
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label>
          結束時間
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>儲存</button>
        <button className="btn-secondary" onClick={() => { setEditing(false); setLabel(b.label || ""); setStartTime(b.start_time || ""); setEndTime(b.end_time || ""); }}>取消</button>
      </div>
    </div>
  );
}

/* ============================================================
   金流紀錄
   ============================================================ */
function CashflowManager({ members, sessions, payments, manualCharges, venues, venuePurchaseRecords, purchaseRecords, miscExpenses, coaches, isStaff, currentCoachId, onAddVenue, onUpdateVenue, onDeleteVenue, onPurchaseVenue, onDeleteVenuePurchaseRecord, onAddMiscExpense, onDeleteMiscExpense }) {
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venuePurchaseFor, setVenuePurchaseFor] = useState(null);
  const [editingVenueId, setEditingVenueId] = useState(null);
  const [viewingVenueId, setViewingVenueId] = useState(null);
  const [detailModal, setDetailModal] = useState(null); // 'paid' | 'trial' | 'charge' | 'refund' | 'venue' | 'misc'
  // 金流篩選:依「實際付款日期」篩選年份/月份,空字串代表不篩選(全部)
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const regularMembers = members.filter((m) => m.member_type === "member");
  const trialMembers = members.filter((m) => m.member_type === "trial");
  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  // 篩選後的付款紀錄:依「應付款日期」篩選年份/月份,只影響「已收金額」相關統計,
  // 未付款項(課費總額、未收金額等)不受年月篩選影響
  const filteredPayments = useMemo(() => {
    if (!filterYear && !filterMonth) return payments;
    return payments.filter((p) => {
      if (!p.is_paid || !p.due_date) return false;
      const [y, m] = p.due_date.split("-");
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== filterMonth) return false;
      return true;
    });
  }, [payments, filterYear, filterMonth]);

  const availableYears = useMemo(() => {
    const years = new Set();
    payments.forEach((p) => {
      if (p.due_date) years.add(p.due_date.slice(0, 4));
      else if (p.paid_date) years.add(p.paid_date.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [payments]);

  // 手動調整紀錄依「調整日期」篩選年份/月份(扣費/退費統計用)
  const filteredManualCharges = useMemo(() => {
    if (!filterYear && !filterMonth) return manualCharges || [];
    return (manualCharges || []).filter((c) => {
      if (!c.charge_date) return false;
      const [y, m] = c.charge_date.split("-");
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== filterMonth) return false;
      return true;
    });
  }, [manualCharges, filterYear, filterMonth]);

  // 場地新購紀錄依「新購日期」篩選年份/月份(場地支出統計用)
  const filteredVenuePurchaseRecords = useMemo(() => {
    if (!filterYear && !filterMonth) return venuePurchaseRecords || [];
    return (venuePurchaseRecords || []).filter((r) => {
      if (!r.purchase_date) return false;
      const [y, m] = r.purchase_date.split("-");
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== filterMonth) return false;
      return true;
    });
  }, [venuePurchaseRecords, filterYear, filterMonth]);

  // 雜項支出依「支出日期」篩選年份/月份
  const filteredMiscExpenses = useMemo(() => {
    if (!filterYear && !filterMonth) return miscExpenses || [];
    return (miscExpenses || []).filter((e) => {
      if (!e.expense_date) return false;
      const [y, m] = e.expense_date.split("-");
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== filterMonth) return false;
      return true;
    });
  }, [miscExpenses, filterYear, filterMonth]);

  const miscExpenseTotal = useMemo(() => {
    return filteredMiscExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredMiscExpenses]);

  const venueSummary = useMemo(() => {
    let totalSpent = 0;
    const list = (venues || []).map((v) => {
      const remaining = Math.max(v.total_sessions - v.used_sessions, 0);
      const spent = v.total_sessions * (v.price_per_session || 0);
      totalSpent += spent;
      return { ...v, remaining, spent };
    });
    return { list, totalSpent };
  }, [venues]);

  // 篩選期間內的場地支出(若無篩選則等同 venueSummary.totalSpent 的逐筆加總版本)
  const filteredVenueSpent = useMemo(() => {
    if (!filterYear && !filterMonth) return venueSummary.totalSpent;
    return filteredVenuePurchaseRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [filterYear, filterMonth, filteredVenuePurchaseRecords, venueSummary.totalSpent]);

  const summary = useMemo(() => {
    // 課費總金額:逐筆購課紀錄加總(每次購課堂數 × 該次單堂金額),而非「總堂數 × 目前單堂金額」
    const purchasesByMember = {};
    (purchaseRecords || []).forEach((r) => {
      if (!purchasesByMember[r.member_id]) purchasesByMember[r.member_id] = [];
      purchasesByMember[r.member_id].push(r);
    });

    let totalUnfinishedFee = 0;
    let totalCourseFee = 0;

    const perMember = regularMembers.map((m) => {
      const remaining = Math.max(m.total_sessions - m.used_sessions, 0);
      // 未完成課費 = 剩餘堂數 × 最新一次購課單價(member.price_per_session 會在每次購課時更新)
      const unfinishedFee = remaining * (m.price_per_session || 0);
      const memberPurchases = purchasesByMember[m.id] || [];
      const courseFee = memberPurchases.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const memberPayments = payments.filter((p) => p.member_id === m.id);
      const allPaid = memberPayments.filter((p) => p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0);
      const unpaid = Math.max(courseFee - allPaid, 0);

      totalUnfinishedFee += unfinishedFee;
      totalCourseFee += courseFee;

      return { member: m, remaining, unfinishedFee, courseFee, paid: allPaid, unpaid, payments: memberPayments };
    });

    // 體驗課課費總額:涵蓋所有曾經是體驗課、且填過課費的學員,
    // 即使後來已轉為正式學員,這筆歷史課費紀錄仍應保留在金流統計中。
    // 篩選年月時依「體驗課日期(trial_session_date)」篩選。
    const trialFeeTotal = members.reduce((sum, m) => sum + Number(m.trial_fee || 0), 0);
    const filteredTrialFeeTotal = members.reduce((sum, m) => {
      if (!m.trial_fee) return sum;
      if (!filterYear && !filterMonth) return sum + Number(m.trial_fee || 0);
      if (!m.trial_session_date) return sum;
      const [y, mo] = m.trial_session_date.split("-");
      if (filterYear && y !== filterYear) return sum;
      if (filterMonth && mo !== filterMonth) return sum;
      return sum + Number(m.trial_fee || 0);
    }, 0);

    // 已收金額(篩選期間):所有學員已結清的繳款紀錄 + 體驗課課費總額(同樣依篩選期間計算)
    const totalPaid = filteredPayments.filter((p) => p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0) + filteredTrialFeeTotal;

    // 未收取課費總額 = 課費總金額 - 已收金額(此處用未篩選的全部已收金額,反映真實未收餘額)
    const totalPaidAll = payments.filter((p) => p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0) + trialFeeTotal;
    const totalUnpaidFromInstallments = Math.max(totalCourseFee - totalPaidAll, 0);

    // 手動調整:依篩選期間(調整日期)拆分為「扣費」與「退費」兩個獨立小計,
    // amount 為正值代表扣費、負值代表退費
    const manualChargeOnly = filteredManualCharges.filter((c) => Number(c.amount || 0) > 0).reduce((sum, c) => sum + Number(c.amount), 0);
    const manualRefundOnly = filteredManualCharges.filter((c) => Number(c.amount || 0) < 0).reduce((sum, c) => sum + Math.abs(Number(c.amount)), 0);
    const manualChargeTotal = manualChargeOnly - manualRefundOnly;

    return {
      totalUnfinishedFee,
      totalCourseFee,
      totalPaid,
      totalUnpaidFromInstallments,
      perMember,
      trialFeeTotal,
      filteredTrialFeeTotal,
      manualChargeTotal,
      manualChargeOnly,
      manualRefundOnly,
    };
  }, [regularMembers, members, payments, filteredPayments, purchaseRecords, filteredManualCharges, filterYear, filterMonth]);

  // 篩選後的體驗課學員清單(供「體驗課課費總額」明細彈窗使用)
  const filteredTrialFeeMembers = useMemo(() => {
    return members.filter((m) => {
      if (!m.trial_fee || Number(m.trial_fee) <= 0) return false;
      if (!filterYear && !filterMonth) return true;
      if (!m.trial_session_date) return false;
      const [y, mo] = m.trial_session_date.split("-");
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && mo !== filterMonth) return false;
      return true;
    });
  }, [members, filterYear, filterMonth]);

  // 毛利 = 已收金額(篩選期間) + 手動調整金額合計(淨額,篩選期間) - 場地支出(篩選期間) - 雜項支出(篩選期間)
  const grossProfit = summary.totalPaid + summary.manualChargeTotal - filteredVenueSpent - miscExpenseTotal;


  const [showMiscForm, setShowMiscForm] = useState(false);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>金流紀錄</h1>
          <p className="page-sub">學員課費與分期付款總覽</p>
        </div>
        <button className="btn-primary" onClick={() => setShowMiscForm((v) => !v)}>
          {showMiscForm ? <X size={16} /> : <Plus size={16} />}
          {showMiscForm ? "取消" : "新增雜項支出"}
        </button>
      </div>

      {showMiscForm && (
        <MiscExpenseInlineForm
          coaches={coaches}
          isStaff={isStaff}
          currentCoachId={currentCoachId}
          onAdd={async (payload) => {
            await onAddMiscExpense(payload);
            setShowMiscForm(false);
          }}
        />
      )}

      <div className="cashflow-filter-row">
        <label>
          年份
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">全部</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y} 年</option>
            ))}
          </select>
        </label>
        <label>
          月份
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">全部</option>
            {Array.from({ length: 12 }, (_, i) => pad2(i + 1)).map((m) => (
              <option key={m} value={m}>{Number(m)} 月</option>
            ))}
          </select>
        </label>
        {(filterYear || filterMonth) && (
          <button type="button" className="btn-secondary small" onClick={() => { setFilterYear(""); setFilterMonth(""); }}>
            清除篩選
          </button>
        )}
      </div>
      {(filterYear || filterMonth) && (
        <div className="hint-box">
          「已收金額」「手動調整扣費」「手動調整退費」「手動調整金額合計」「場地總支出金額」「雜項支出總額」「毛利」目前僅顯示落在 {filterYear ? `${filterYear}年` : ""}{filterMonth ? `${Number(filterMonth)}月` : ""} 範圍內的紀錄,其餘課費總額、未收金額、體驗課課費總額不受篩選影響。
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">未完成課程課費總額</span>
          <span className="stat-value">{fmtMoney(summary.totalUnfinishedFee)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">課費總金額</span>
          <span className="stat-value">{fmtMoney(summary.totalCourseFee)}</span>
        </div>
        <div className="stat-card clickable" onClick={() => setDetailModal("paid")} role="button" tabIndex={0}>
          <span className="stat-label">{filterYear || filterMonth ? "已收金額(篩選期間)" : "已收金額"}</span>
          <span className="stat-value accent">{fmtMoney(summary.totalPaid)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">未收取課費總額</span>
          <span className="stat-value warn">{fmtMoney(summary.totalUnpaidFromInstallments)}</span>
        </div>
        {summary.trialFeeTotal > 0 && (
          <div className="stat-card clickable" onClick={() => setDetailModal("trial")} role="button" tabIndex={0}>
            <span className="stat-label">{filterYear || filterMonth ? "體驗課課費總額(篩選期間)" : "體驗課課費總額"}</span>
            <span className="stat-value">{fmtMoney(summary.filteredTrialFeeTotal)}</span>
          </div>
        )}
        {summary.manualChargeOnly > 0 && (
          <div className="stat-card clickable" onClick={() => setDetailModal("charge")} role="button" tabIndex={0}>
            <span className="stat-label">{filterYear || filterMonth ? "手動調整扣費(篩選期間)" : "手動調整扣費"}</span>
            <span className="stat-value accent">{fmtMoney(summary.manualChargeOnly)}</span>
          </div>
        )}
        {summary.manualRefundOnly > 0 && (
          <div className="stat-card clickable" onClick={() => setDetailModal("refund")} role="button" tabIndex={0}>
            <span className="stat-label">{filterYear || filterMonth ? "手動調整退費(篩選期間)" : "手動調整退費"}</span>
            <span className="stat-value warn">{fmtMoney(summary.manualRefundOnly)}</span>
          </div>
        )}
        {summary.manualChargeTotal !== 0 && (
          <div className="stat-card">
            <span className="stat-label">手動調整金額合計</span>
            <span className="stat-value">
              {summary.manualChargeTotal >= 0 ? fmtMoney(summary.manualChargeTotal) : `- ${fmtMoney(Math.abs(summary.manualChargeTotal))}`}
            </span>
          </div>
        )}
        {venueSummary.list.length > 0 && (
          <div className="stat-card clickable" onClick={() => setDetailModal("venue")} role="button" tabIndex={0}>
            <span className="stat-label">{filterYear || filterMonth ? "場地總支出金額(篩選期間)" : "場地總支出金額"}</span>
            <span className="stat-value warn">{fmtMoney(filteredVenueSpent)}</span>
          </div>
        )}
        {miscExpenseTotal > 0 && (
          <div className="stat-card clickable" onClick={() => setDetailModal("misc")} role="button" tabIndex={0}>
            <span className="stat-label">{filterYear || filterMonth ? "雜項支出總額(篩選期間)" : "雜項支出總額"}</span>
            <span className="stat-value warn">{fmtMoney(miscExpenseTotal)}</span>
          </div>
        )}
        <div className="stat-card">
          <span className="stat-label">{filterYear || filterMonth ? "毛利(篩選期間)" : "毛利"}</span>
          <span className={`stat-value ${grossProfit < 0 ? "warn" : "accent"}`}>
            {grossProfit >= 0 ? fmtMoney(grossProfit) : `- ${fmtMoney(Math.abs(grossProfit))}`}
          </span>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <Wallet size={18} />
          <h2>各學員課費明細</h2>
        </div>
        {summary.perMember.length === 0 ? (
          <div className="empty-block">尚無學員資料。</div>
        ) : (
          <div className="list">
            {summary.perMember.map(({ member, courseFee, paid, unpaid, payments: memberPayments }) => {
              const expanded = expandedMemberId === member.id;
              const sortedPayments = memberPayments.slice().sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
              return (
                <div key={member.id}>
                  <button className="list-row clickable" onClick={() => setExpandedMemberId(expanded ? null : member.id)}>
                    <div className="list-row-main">
                      <span className="list-row-title">{member.name}</span>
                      <span className="list-row-sub">
                        單堂 {fmtMoney(member.price_per_session)} · 總金額 {fmtMoney(courseFee)} · 已收 {fmtMoney(paid)}
                      </span>
                    </div>
                    <span className={`pill ${unpaid > 0 ? "pill-warn" : "pill-free"}`}>
                      {unpaid > 0 ? `未付 ${fmtMoney(unpaid)}` : "已結清"}
                    </span>
                  </button>
                  {expanded && (
                    <div className="payment-records">
                      {sortedPayments.length === 0 ? (
                        <div className="empty-block small">尚無分期付款紀錄。</div>
                      ) : (
                        sortedPayments.map((p) => (
                          <div className="payment-record-row" key={p.id}>
                            <span>
                              第 {p.installment_no}/{p.installment_total} 期 · 應付日 {fmtDate(p.due_date)}
                              {p.payment_method ? ` · ${p.payment_method}` : ""}
                              {p.is_paid ? ` · 已結清` : ` · 未結清`}
                            </span>
                            <span className="payment-amount">{fmtMoney(p.amount)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(() => {
        // 涵蓋所有曾經有體驗課費或體驗課日期紀錄的學員,即使已轉為正式學員,
        // 歷史體驗課資料(課費、付款末五碼、體驗課日期)仍應留存可查詢
        const trialHistoryMembers = members.filter(
          (m) => m.member_type === "trial" || m.trial_fee > 0 || m.trial_session_date
        );
        if (trialHistoryMembers.length === 0) return null;
        return (
          <div className="section">
            <div className="section-head">
              <Users size={18} />
              <h2>體驗課學員課費</h2>
            </div>
            <div className="list">
              {trialHistoryMembers.map((m) => (
                <div className="list-row" key={m.id}>
                  <div className="list-row-main">
                    <span className="list-row-title">
                      {m.name}
                      <span className="pill pill-trial">體驗課</span>
                      {m.member_type === "member" && <span className="pill pill-free">已轉正式</span>}
                    </span>
                    <span className="list-row-sub">
                      付款帳號末五碼:{m.trial_payment_last5 || "未填寫"}
                      {m.trial_fee > 0 ? ` · 課費 ${fmtMoney(m.trial_fee)}` : ""}
                      {m.trial_session_date ? ` · 體驗課日期 ${fmtDate(m.trial_session_date)}` : ""}
                    </span>
                  </div>
                  {m.member_type === "trial" && (
                    <span className="pill pill-muted">
                      {m.trial_followup_status === "converted" ? "已轉正式" : "追蹤中"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      <div className="section">
        <div className="section-head">
          <MapPin size={18} />
          <h2>場地金流</h2>
        </div>
        <button className="btn-primary" onClick={() => setShowVenueForm((v) => !v)}>
          {showVenueForm ? <X size={16} /> : <Plus size={16} />}
          {showVenueForm ? "取消" : "新增場地"}
        </button>

        {showVenueForm && (
          <VenueForm
            coaches={coaches}
            isStaff={isStaff}
            currentCoachId={currentCoachId}
            onAdd={async (payload) => {
              await onAddVenue(payload);
              setShowVenueForm(false);
            }}
          />
        )}

        {venueSummary.list.length === 0 ? (
          <div className="empty-block">尚無場地資料,點上方「新增場地」開始建立。排課時填寫的「地點」若與場地名稱相同,完成課堂後會自動扣除場地次數。</div>
        ) : (
          <div className="list">
            {venueSummary.list.map((v) => {
              const low = v.remaining <= 3;
              const editing = editingVenueId === v.id;
              return (
                <div key={v.id}>
                  <div
                    className={`list-row venue-row clickable ${low ? "low" : ""}`}
                    onClick={() => setViewingVenueId(v.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="list-row-main">
                      <span className="list-row-title">
                        {v.name}
                        {low && (
                          <span className="badge-warning badge-alert">
                            <AlertTriangle size={13} strokeWidth={2.5} /> 剩餘不足
                          </span>
                        )}
                      </span>
                      <span className="list-row-sub">
                        單堂 {fmtMoney(v.price_per_session)} · 已用 {v.used_sessions}/{v.total_sessions} 次 · 剩餘 {v.remaining} 次 · 總支出 {fmtMoney(v.spent)}
                      </span>
                    </div>
                    <div className="venue-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-secondary small" onClick={() => setVenuePurchaseFor(v)}>
                        <ShoppingCart size={14} /> 新購
                      </button>
                      <button className="btn-secondary small" onClick={() => setEditingVenueId(editing ? null : v.id)}>
                        編輯
                      </button>
                      <button className="icon-btn" onClick={() => onDeleteVenue(v.id)} title="刪除">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {editing && (
                    <VenueEditForm
                      venue={v}
                      onSave={async (updates) => {
                        await onUpdateVenue(v.id, updates);
                        setEditingVenueId(null);
                      }}
                      onCancel={() => setEditingVenueId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {venuePurchaseFor && (
          <VenuePurchaseModal
            venue={venuePurchaseFor}
            onClose={() => setVenuePurchaseFor(null)}
            onPurchase={onPurchaseVenue}
          />
        )}

        {viewingVenueId && (
          <VenueUsageModal
            venue={venueSummary.list.find((v) => v.id === viewingVenueId)}
            sessions={sessions || []}
            members={members}
            onClose={() => setViewingVenueId(null)}
          />
        )}

        {detailModal === "paid" && (
          <CashflowDetailModal
            title="已收金額明細"
            onClose={() => setDetailModal(null)}
            rows={filteredPayments
              .filter((p) => p.is_paid)
              .map((p) => ({
                name: memberMap[p.member_id]?.name || "未知學員",
                amount: Number(p.amount || 0),
                date: p.paid_date || p.due_date,
              }))
              .concat(
                filteredTrialFeeMembers.map((m) => ({
                  name: m.name,
                  amount: Number(m.trial_fee || 0),
                  date: m.trial_session_date,
                }))
              )}
          />
        )}

        {detailModal === "trial" && (
          <CashflowDetailModal
            title="體驗課課費明細"
            onClose={() => setDetailModal(null)}
            rows={filteredTrialFeeMembers.map((m) => ({
              name: m.name,
              amount: Number(m.trial_fee || 0),
              date: m.trial_session_date,
            }))}
          />
        )}

        {detailModal === "charge" && (
          <CashflowDetailModal
            title="手動調整扣費明細"
            onClose={() => setDetailModal(null)}
            rows={filteredManualCharges
              .filter((c) => Number(c.amount || 0) > 0)
              .map((c) => ({
                name: memberMap[c.member_id]?.name || "未知學員",
                amount: Number(c.amount || 0),
                date: c.charge_date,
              }))}
          />
        )}

        {detailModal === "refund" && (
          <CashflowDetailModal
            title="手動調整退費明細"
            onClose={() => setDetailModal(null)}
            rows={filteredManualCharges
              .filter((c) => Number(c.amount || 0) < 0)
              .map((c) => ({
                name: memberMap[c.member_id]?.name || "未知學員",
                amount: Math.abs(Number(c.amount || 0)),
                date: c.charge_date,
              }))}
          />
        )}

        {detailModal === "venue" && (
          <CashflowDetailModal
            title="場地支出明細"
            onClose={() => setDetailModal(null)}
            nameLabel="場地"
            rows={filteredVenuePurchaseRecords.map((r) => ({
              name: venues.find((v) => v.id === r.venue_id)?.name || "未知場地",
              amount: Number(r.amount || 0),
              date: r.purchase_date,
            }))}
          />
        )}

        {detailModal === "misc" && (
          <CashflowDetailModal
            title="雜項支出明細"
            onClose={() => setDetailModal(null)}
            nameLabel="品項"
            rows={filteredMiscExpenses.map((e) => ({
              name: e.label || "雜項支出",
              amount: Number(e.amount || 0),
              date: e.expense_date,
            }))}
          />
        )}
      </div>

      <MiscExpenseSection
        miscExpenses={miscExpenses || []}
        coaches={coaches}
        isStaff={isStaff}
        currentCoachId={currentCoachId}
        onAddMiscExpense={onAddMiscExpense}
        onDeleteMiscExpense={onDeleteMiscExpense}
      />
    </div>
  );
}

/* ---------- 金流明細彈窗(已收金額/體驗課課費/手動調整/場地支出/雜項支出 共用) ---------- */
function CashflowDetailModal({ title, rows, onClose, nameLabel }) {
  const sorted = rows.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            <p className="modal-sub">共 {sorted.length} 筆,合計 {fmtMoney(total)}</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {sorted.length === 0 ? (
            <div className="empty-block">尚無資料。</div>
          ) : (
            <div className="list">
              {sorted.map((r, i) => (
                <div className="list-row" key={i}>
                  <div className="list-row-main">
                    <span className="list-row-title">{r.name}</span>
                    <span className="list-row-sub">{r.date ? fmtDate(r.date) : "日期未知"}</span>
                  </div>
                  <span className="payment-amount">{fmtMoney(r.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <div className="spacer" />
          <button className="btn-primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 雜項支出區塊 ---------- */
const MISC_EXPENSE_LABELS = ["停車費", "油錢", "其他"];

/* ---------- 金流頁頂部快速新增雜項支出表單 ---------- */
function MiscExpenseInlineForm({ coaches, isStaff, currentCoachId, onAdd }) {
  const [labelOption, setLabelOption] = useState("停車費");
  const [customLabel, setCustomLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [coachId, setCoachId] = useState(currentCoachId || "");
  const [note, setNote] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalLabel = labelOption === "其他" ? customLabel.trim() : labelOption;
    if (!finalLabel || !amount) return;
    await onAdd({
      label: finalLabel,
      amount: Number(amount),
      expense_date: expenseDate,
      coach_id: coachId || currentCoachId,
      note: note.trim(),
    });
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <label>
        品項
        <select value={labelOption} onChange={(e) => setLabelOption(e.target.value)}>
          {MISC_EXPENSE_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      {labelOption === "其他" && (
        <label>
          品項名稱
          <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="請輸入品項名稱" required />
        </label>
      )}
      <div className="form-grid">
        <label>
          金額(元)
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label>
          日期
          <div className="date-time-wrap">
            <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
          </div>
        </label>
        {isStaff && (
          <label>
            所屬教練
            <select value={coachId} onChange={(e) => setCoachId(e.target.value)} required>
              <option value="">請選擇</option>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </label>
        )}
      </div>
      <label className="block-label">
        備註(選填)
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="選填" />
      </label>
      <button type="submit" className="btn-primary full">新增</button>
    </form>
  );
}

function MiscExpenseSection({ miscExpenses, coaches, isStaff, currentCoachId, onAddMiscExpense, onDeleteMiscExpense }) {
  const [showForm, setShowForm] = useState(false);
  const [labelOption, setLabelOption] = useState("停車費");
  const [customLabel, setCustomLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [coachId, setCoachId] = useState(currentCoachId || "");
  const [note, setNote] = useState("");

  const sorted = miscExpenses.slice().sort((a, b) => (b.expense_date || "").localeCompare(a.expense_date || ""));
  const coachMap = useMemo(() => {
    const map = {};
    coaches.forEach((c) => (map[c.id] = c.full_name));
    return map;
  }, [coaches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalLabel = labelOption === "其他" ? customLabel.trim() : labelOption;
    if (!finalLabel || !amount) return;
    await onAddMiscExpense({
      label: finalLabel,
      amount: Number(amount),
      expense_date: expenseDate,
      coach_id: coachId || currentCoachId,
      note: note.trim(),
    });
    setLabelOption("停車費"); setCustomLabel(""); setAmount(""); setExpenseDate(todayStr()); setNote("");
    setShowForm(false);
  };

  return (
    <div className="section">
      <div className="section-head">
        <Wallet size={18} />
        <h2>雜項支出</h2>
      </div>
      <p className="page-sub">記錄不屬於學員課費或場地費的其他支出,例如停車費、油錢等</p>

      <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
        {showForm ? <X size={16} /> : <Plus size={16} />}
        {showForm ? "取消" : "新增雜項支出"}
      </button>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <label>
            品項
            <select value={labelOption} onChange={(e) => setLabelOption(e.target.value)}>
              {MISC_EXPENSE_LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          {labelOption === "其他" && (
            <label>
              品項名稱
              <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="請輸入品項名稱" required />
            </label>
          )}
          <div className="form-grid">
            <label>
              金額(元)
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <label>
              日期
              <div className="date-time-wrap">
                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
              </div>
            </label>
            {isStaff && (
              <label>
                所屬教練
                <select value={coachId} onChange={(e) => setCoachId(e.target.value)} required>
                  <option value="">請選擇教練</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="block-label">
            備註(選填)
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="選填" />
          </label>
          <button type="submit" className="btn-primary full">新增</button>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="empty-block">尚無雜項支出紀錄。</div>
      ) : (
        <div className="list">
          {sorted.map((e) => (
            <div className="payment-row" key={e.id}>
              <div className="list-row-main">
                <span className="list-row-title">{e.label || "雜項支出"}</span>
                <span className="list-row-sub">
                  {fmtDate(e.expense_date)} · {fmtMoney(e.amount)}
                  {isStaff && coachMap[e.coach_id] ? ` · ${coachMap[e.coach_id]}` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </span>
              </div>
              <button className="icon-btn" onClick={() => onDeleteMiscExpense(e.id)} title="刪除">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 新增場地表單 ---------- */
function VenueForm({ coaches, isStaff, currentCoachId, onAdd }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [totalSessions, setTotalSessions] = useState(10);
  const [coachId, setCoachId] = useState(currentCoachId || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd({
      name: name.trim(),
      price_per_session: price === "" ? 0 : Number(price),
      total_sessions: Number(totalSessions),
      coach_id: coachId || currentCoachId,
    });
    setName("");
    setPrice("");
    setTotalSessions(10);
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          場地名稱
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="需與排課時填寫的地點一致" required />
        </label>
        <label>
          單堂課金額
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label>
          總購買次數
          <input type="number" min={0} value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} required />
        </label>
        {isStaff && (
          <label>
            所屬教練
            <select value={coachId} onChange={(e) => setCoachId(e.target.value)} required>
              <option value="">請選擇教練</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <button type="submit" className="btn-primary full">
        新增場地
      </button>
    </form>
  );
}

/* ---------- 編輯場地表單 ---------- */
function VenueEditForm({ venue, onSave, onCancel }) {
  const [name, setName] = useState(venue.name);
  const [price, setPrice] = useState(venue.price_per_session);
  const [totalSessions, setTotalSessions] = useState(venue.total_sessions);
  const [usedSessions, setUsedSessions] = useState(venue.used_sessions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({
      name: name.trim(),
      price_per_session: Number(price) || 0,
      total_sessions: Number(totalSessions) || 0,
      used_sessions: Number(usedSessions) || 0,
    });
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          場地名稱
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          單堂課金額
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label>
          總次數
          <input type="number" min={0} value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} />
        </label>
        <label>
          已使用次數
          <input type="number" min={0} value={usedSessions} onChange={(e) => setUsedSessions(e.target.value)} />
        </label>
      </div>
      <div className="inline-form-row">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary full">
          儲存
        </button>
      </div>
    </form>
  );
}

/* ---------- 場地新購 Modal ---------- */
function VenuePurchaseModal({ venue, onClose, onPurchase }) {
  const [sessionsAdded, setSessionsAdded] = useState(10);
  const [pricePerSession, setPricePerSession] = useState(venue.price_per_session || "");
  const [purchaseDate, setPurchaseDate] = useState(todayStr());

  // 金額固定為「新購次數 × 本次單堂場地費」,不再提供手動覆寫的實付金額欄位
  const calcAmount = sessionsAdded && pricePerSession
    ? Number(sessionsAdded) * Number(pricePerSession)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onPurchase(
      venue.id,
      Number(sessionsAdded),
      pricePerSession !== "" ? Number(pricePerSession) : null,
      calcAmount,
      purchaseDate,
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{venue.name} — 新購場地次數</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form-card">
          <label>
            新購次數
            <input type="number" min={1} value={sessionsAdded} onChange={(e) => setSessionsAdded(e.target.value)} required />
          </label>
          <label>
            本次單堂場地費(元)
            <input
              type="number"
              min={0}
              value={pricePerSession}
              onChange={(e) => setPricePerSession(e.target.value)}
              placeholder={`上次 $${venue.price_per_session || 0}`}
            />
          </label>
          <label>
            新購日期
            <div className="date-time-wrap">
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
            </div>
          </label>
          <p className="modal-hint">
            總次數 {venue.total_sessions} → 新購後 {venue.total_sessions + Number(sessionsAdded || 0)}
            {pricePerSession !== "" && ` · 本次單堂場地費將更新為 $${Number(pricePerSession).toLocaleString()}`}
            {calcAmount > 0 && ` · 支出金額 $${calcAmount.toLocaleString()}`}
          </p>
          <button type="submit" className="btn-primary full">
            確認新購
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   場地使用紀錄 Modal — 顯示該場地過去已完成課堂的使用時間與學員
   ============================================================ */
function VenueUsageModal({ venue, sessions, members, onClose }) {
  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  const usageList = useMemo(() => {
    if (!venue) return [];
    return sessions
      .filter((s) => s.status === "completed" && s.location === venue.name)
      .sort((a, b) => (b.session_date + b.start_time).localeCompare(a.session_date + a.start_time));
  }, [sessions, venue]);

  if (!venue) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{venue.name} — 使用紀錄</h3>
            <p className="modal-sub">共 {usageList.length} 筆已完成課堂使用此場地</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {usageList.length === 0 ? (
            <div className="empty-block">尚無使用紀錄。</div>
          ) : (
            <div className="list">
              {usageList.map((s) => {
                const m = memberMap[s.member_id];
                return (
                  <div className="list-row" key={s.id}>
                    <div className="list-row-main">
                      <span className="list-row-title">{m?.name || "未知學員"}</span>
                      <span className="list-row-sub">
                        {fmtDate(s.session_date)} · {s.start_time} · {s.duration_min} 分鐘
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <div className="spacer" />
          <button className="btn-primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   主程式
   ============================================================ */
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bodyRecords, setBodyRecords] = useState([]);
  const [venues, setVenues] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [manualCharges, setManualCharges] = useState([]);
  const [periodRecords, setPeriodRecords] = useState([]);
  const [memberPhotos, setMemberPhotos] = useState([]);
  const [purchaseRecords, setPurchaseRecords] = useState([]);
  const [venuePurchaseRecords, setVenuePurchaseRecords] = useState([]);
  const [miscExpenses, setMiscExpenses] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [presetMemberId, setPresetMemberId] = useState(null);
  const [openMemberId, setOpenMemberId] = useState(null);
  const [loadError, setLoadError] = useState("");
  // 小編登入時需先選擇要查看哪位教練的資料,選定後所有頁面只顯示該教練的資料;
  // 教練登入時固定為自己的 id,不需選擇
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [showCoachSwitcher, setShowCoachSwitcher] = useState(false);

  const isStaff = profile?.role === "staff";
  // 實際用來篩選資料範圍的教練 id:教練固定為自己,小編則為目前選定的教練(尚未選擇時為 null)
  const scopeCoachId = isStaff ? selectedCoachId : session?.user?.id || null;

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load profile
  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  // Load list of coaches (for staff to assign members)
  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "coach")
      .order("full_name")
      .then(({ data }) => setCoaches(data || []));
  }, [session]);

  // Load + subscribe to data (RLS already scopes rows by coach)
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const loadAll = async () => {
      const [
        { data: m, error: mErr },
        { data: s, error: sErr },
        { data: p, error: pErr },
        { data: b, error: bErr },
        { data: v, error: vErr },
        { data: bt, error: btErr },
        { data: mc, error: mcErr },
        { data: pr, error: prErr },
        { data: mp, error: mpErr },
        { data: pur, error: purErr },
        { data: vpr, error: vprErr },
        { data: me, error: meErr },
      ] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("sessions").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("body_records").select("*"),
        supabase.from("venues").select("*").order("name"),
        supabase.from("blocked_times").select("*"),
        supabase.from("manual_charges").select("*"),
        supabase.from("period_records").select("*"),
        supabase.from("member_photos").select("*"),
        supabase.from("purchase_records").select("*"),
        supabase.from("venue_purchase_records").select("*"),
        supabase.from("misc_expenses").select("*"),
      ]);
      if (cancelled) return;
      if (mErr || sErr || pErr || bErr || vErr || btErr || mcErr || prErr || mpErr || purErr || vprErr || meErr) {
        setLoadError((mErr || sErr || pErr || bErr || vErr || btErr || mcErr || prErr || mpErr || purErr || vprErr || meErr).message);
        return;
      }
      // 將每位學員的月經歷史紀錄整理出「最近一次來潮日期」與「自動計算的平均週期天數」,
      // 附加到 member 物件上,讓既有的 inbodyReminderStatus / menstrualReminderStatus
      // 等函式不需更動即可繼續運作
      const periodsByMember = {};
      (pr || []).forEach((rec) => {
        if (!periodsByMember[rec.member_id]) periodsByMember[rec.member_id] = [];
        periodsByMember[rec.member_id].push(rec);
      });
      const membersWithCycle = (m || []).map((mem) => {
        const records = (periodsByMember[mem.id] || []).slice().sort((a, b) => a.period_date.localeCompare(b.period_date));
        if (records.length === 0) {
          return { ...mem, last_period_date: null, cycle_length_days: mem.cycle_length_days || 28 };
        }
        const lastDate = records[records.length - 1].period_date;
        let cycleLength = mem.cycle_length_days || 28;
        if (records.length >= 2) {
          const diffs = [];
          for (let i = 1; i < records.length; i++) {
            diffs.push(daysBetween(records[i - 1].period_date, records[i].period_date));
          }
          const avg = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
          cycleLength = Math.round(avg);
        }
        return { ...mem, last_period_date: lastDate, cycle_length_days: cycleLength };
      });
      setMembers(membersWithCycle);
      setSessions(s || []);
      setPayments(p || []);
      setBodyRecords(b || []);
      setVenues(v || []);
      setBlockedTimes(bt || []);
      setManualCharges(mc || []);
      setPeriodRecords(pr || []);
      setMemberPhotos(mp || []);
      setPurchaseRecords(pur || []);
      setVenuePurchaseRecords(vpr || []);
      setMiscExpenses(me || []);
    };
    loadAll();

    const channel = supabase
      .channel("shared-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "body_records" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "venues" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "blocked_times" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "manual_charges" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "period_records" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "member_photos" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_records" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "venue_purchase_records" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "misc_expenses" }, loadAll)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setMembers([]);
    setSessions([]);
    setPayments([]);
    setBodyRecords([]);
    setVenues([]);
    setBlockedTimes([]);
  };

  /* ---- Mutations: Members ---- */
  const addMember = async (payload) => {
    await supabase.from("members").insert(payload);
  };

  const updateMember = async (memberId, updates) => {
    await supabase.from("members").update(updates).eq("id", memberId);
  };

  const deleteMember = async (memberId) => {
    await supabase.from("members").delete().eq("id", memberId);
  };

  const purchaseMore = async (memberId, sessionsAdded, amount = 0, newPricePerSession = null, purchaseDate = null) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const dateStr = purchaseDate || todayStr();
    const finalPrice = newPricePerSession !== null ? newPricePerSession : member.price_per_session || 0;
    // 增加總堂數,並把這次購課的單堂金額更新為學員目前的 price_per_session
    // (用於「未完成課費」等以「最新一次購課單價」計算的地方)
    await supabase
      .from("members")
      .update({
        total_sessions: member.total_sessions + sessionsAdded,
        price_per_session: finalPrice,
      })
      .eq("id", memberId);
    // 寫入購課歷史紀錄(購課日期、堂數、單堂金額),供「基本資料」分頁的購課紀錄列表
    // 與「課費總金額」(逐筆加總 sessions_added × price_per_session)使用
    await supabase.from("purchase_records").insert({
      member_id: memberId,
      coach_id: member.coach_id,
      purchase_date: dateStr,
      sessions_added: sessionsAdded,
      price_per_session: finalPrice,
      amount,
    });
    // 不再自動新增繳款(payments)紀錄,購課僅記錄堂數與單價,
    // 實際收款請改至「繳款」分頁手動新增分期/付款紀錄
  };

  const deletePurchaseRecord = async (id) => {
    await supabase.from("purchase_records").delete().eq("id", id);
  };

  /* ---- Mutations: Sessions ---- */
  const addSession = async (payloadOrList) => {
    const list = Array.isArray(payloadOrList) ? payloadOrList : [payloadOrList];
    if (list.length === 0) return;
    const rows = list.map(({ member_id, session_date, start_time, duration_min, location, deduct_session }) => {
      const member = members.find((m) => m.id === member_id);
      return {
        member_id,
        coach_id: member?.coach_id || session.user.id,
        session_date,
        start_time,
        duration_min,
        location: location || "",
        status: "scheduled",
        deduct_session: !!deduct_session,
      };
    });
    await supabase.from("sessions").insert(rows);
  };

  const saveSession = async (sessionId, payload) => {
    const target = sessions.find((s) => s.id === sessionId);
    const wasCompleted = target?.status === "completed";
    const update = {
      warmup: payload.warmup,
      main_training: payload.main_training,
      cooldown: payload.cooldown,
      coach_notes: payload.coach_notes,
      energy_rating: payload.energy_rating || null,
      soreness_rating: payload.soreness_rating || null,
      mood_rating: payload.mood_rating || null,
      member_feedback: payload.member_feedback,
      is_absent: payload.is_absent || false,
      absent_deduct: payload.absent_deduct !== false,
      // 排課資訊:已完成的課堂地點可改,未完成的可改日期/時間/時長/地點
      location: payload.location ?? target?.location ?? "",
    };
    if (!wasCompleted) {
      if (payload.session_date) update.session_date = payload.session_date;
      if (payload.start_time) update.start_time = payload.start_time;
      if (payload.duration_min) update.duration_min = Number(payload.duration_min);
    }
    if (payload.markCompleted) update.status = "completed";

    // 記錄最後一次編輯的時間與操作者(僅更新訓練紀錄/儲存草稿等「儲存」動作才記錄,不記錄完成課堂)
    if (!payload.markCompleted || !wasCompleted) {
      update.edited_at = new Date().toISOString();
      update.edited_by = session.user.id;
      update.edited_by_name = profile?.full_name || session.user.email || "";
    }

    await supabase.from("sessions").update(update).eq("id", sessionId);

    const shouldDeduct = target && target.deduct_session;

    if (payload.markCompleted && !wasCompleted && shouldDeduct) {
      const member = members.find((m) => m.id === target.member_id);
      if (member) {
        await supabase
          .from("members")
          .update({ used_sessions: member.used_sessions + 1 })
          .eq("id", member.id);
      }
    }

    // 場地金流:課堂完成時,若地點對應到已建立的場地,場地已使用次數 +1
    if (payload.markCompleted && !wasCompleted && target?.location) {
      const venue = venues.find((v) => v.name === target.location && v.coach_id === target.coach_id);
      if (venue) {
        await supabase
          .from("venues")
          .update({ used_sessions: venue.used_sessions + 1 })
          .eq("id", venue.id);
      }
    }
  };

  const deleteSession = async (sessionId) => {
    const target = sessions.find((s) => s.id === sessionId);
    await supabase.from("sessions").delete().eq("id", sessionId);
    const shouldRefund = target && target.status === "completed" && target.deduct_session;
    if (shouldRefund) {
      const member = members.find((m) => m.id === target.member_id);
      if (member && member.used_sessions > 0) {
        await supabase
          .from("members")
          .update({ used_sessions: member.used_sessions - 1 })
          .eq("id", member.id);
      }
    }

    // 場地金流:刪除已完成課堂時,若地點對應到場地,場地已使用次數 -1
    if (target && target.status === "completed" && target.location) {
      const venue = venues.find((v) => v.name === target.location && v.coach_id === target.coach_id);
      if (venue && venue.used_sessions > 0) {
        await supabase
          .from("venues")
          .update({ used_sessions: venue.used_sessions - 1 })
          .eq("id", venue.id);
      }
    }

    setActiveSession(null);
  };

  /* ---- Mutations: Payments ---- */
  const addPayment = async (memberId, payload) => {
    const member = members.find((m) => m.id === memberId);
    await supabase.from("payments").insert({
      member_id: memberId,
      coach_id: member?.coach_id || session.user.id,
      ...payload,
    });
  };

  const updatePayment = async (paymentId, updates) => {
    await supabase.from("payments").update(updates).eq("id", paymentId);
  };

  const deletePayment = async (paymentId) => {
    await supabase.from("payments").delete().eq("id", paymentId);
  };

  /* ---- Mutations: Body records ---- */
  const addBodyRecord = async (memberId, payload) => {
    const member = members.find((m) => m.id === memberId);
    const { data, error } = await supabase
      .from("body_records")
      .insert({
        member_id: memberId,
        coach_id: member?.coach_id || session.user.id,
        ...payload,
      })
      .select()
      .single();
    if (error) return null;
    return data;
  };

  const updateBodyRecord = async (recordId, updates) => {
    await supabase.from("body_records").update(updates).eq("id", recordId);
  };

  /* ---- Mutations: Venues ---- */
  const addVenue = async (payload) => {
    await supabase.from("venues").insert({
      coach_id: payload.coach_id || session.user.id,
      used_sessions: 0,
      name: payload.name,
      price_per_session: payload.price_per_session,
      total_sessions: payload.total_sessions,
    });
  };

  const updateVenue = async (venueId, updates) => {
    await supabase.from("venues").update(updates).eq("id", venueId);
  };

  const deleteVenue = async (venueId) => {
    await supabase.from("venues").delete().eq("id", venueId);
  };

  const purchaseVenueSessions = async (venueId, sessionsAdded, newPricePerSession = null, amount = 0, purchaseDate = null) => {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue) return;
    const dateStr = purchaseDate || todayStr();
    // 只增加總次數,不更動場地原本的 price_per_session
    await supabase
      .from("venues")
      .update({ total_sessions: venue.total_sessions + Number(sessionsAdded || 0) })
      .eq("id", venueId);
    // 寫入場地新購歷史紀錄(新購日期、次數、單堂場地費)
    await supabase.from("venue_purchase_records").insert({
      venue_id: venueId,
      coach_id: venue.coach_id,
      purchase_date: dateStr,
      sessions_added: Number(sessionsAdded || 0),
      price_per_session: newPricePerSession !== null ? newPricePerSession : venue.price_per_session || 0,
      amount: amount || 0,
    });
  };

  const deleteVenuePurchaseRecord = async (id) => {
    await supabase.from("venue_purchase_records").delete().eq("id", id);
  };

  /* ---- Mutations: Misc expenses(雜項支出) ---- */
  const addMiscExpense = async (payload) => {
    await supabase.from("misc_expenses").insert({
      coach_id: payload.coach_id || session.user.id,
      label: payload.label || "",
      amount: payload.amount || 0,
      expense_date: payload.expense_date || todayStr(),
      note: payload.note || "",
    });
  };

  const deleteMiscExpense = async (id) => {
    await supabase.from("misc_expenses").delete().eq("id", id);
  };

  /* ---- Mutations: Blocked times(不可排課時段) ---- */
  const addBlockedTime = async (payload) => {
    await supabase.from("blocked_times").insert({
      coach_id: payload.coach_id || session.user.id,
      label: payload.label || "",
      block_date: payload.block_date || null,
      // 修正:null 必須維持 null(代表單次日期,不綁定星期),
      // 先前誤把 null 落入 Number(null) = 0,導致單次日期被誤判為「每週日」
      weekday: payload.weekday === "" || payload.weekday === undefined || payload.weekday === null ? null : Number(payload.weekday),
      start_time: payload.start_time,
      end_time: payload.end_time,
    });
  };

  const deleteBlockedTime = async (id) => {
    await supabase.from("blocked_times").delete().eq("id", id);
  };

  const updateBlockedTime = async (id, updates) => {
    await supabase.from("blocked_times").update(updates).eq("id", id);
  };

  /* ---- Mutations: Manual charges(手動調整:扣費/退費、扣除/加回堂數) ---- */
  const addManualCharge = async (memberId, payload) => {
    const member = members.find((m) => m.id === memberId);
    await supabase.from("manual_charges").insert({
      member_id: memberId,
      coach_id: member?.coach_id || session.user.id,
      amount: payload.amount,
      sessions_deducted: payload.sessions_deducted || 0,
      charge_date: payload.charge_date || todayStr(),
      label: payload.label || "",
      note: payload.note || "",
    });
    // sessions_deducted 為正值表示扣除堂數,負值表示加回堂數,直接套用到 total_sessions(學員總購買堂數)
    // (正值時 total_sessions 減少=扣除剩餘總堂數;負值時 total_sessions 增加=加回堂數)
    // used_sessions(已用堂數)不受影響
    const sessionsDelta = Number(payload.sessions_deducted || 0);
    if (sessionsDelta !== 0 && member) {
      const newTotal = Math.max(member.total_sessions - sessionsDelta, 0);
      await supabase
        .from("members")
        .update({ total_sessions: newTotal })
        .eq("id", memberId);
    }
  };

  const deleteManualCharge = async (id) => {
    const target = manualCharges.find((c) => c.id === id);
    await supabase.from("manual_charges").delete().eq("id", id);
    // 刪除手動調整紀錄時,需把該筆對 total_sessions 造成的影響還原回去
    const sessionsDelta = Number(target?.sessions_deducted || 0);
    if (sessionsDelta !== 0) {
      const member = members.find((m) => m.id === target.member_id);
      if (member) {
        const restoredTotal = Math.max(member.total_sessions + sessionsDelta, 0);
        await supabase
          .from("members")
          .update({ total_sessions: restoredTotal })
          .eq("id", member.id);
      }
    }
  };

  /* ---- Mutations: Period records(月經週期紀錄) ---- */
  const addPeriodRecord = async (memberId, payload) => {
    const member = members.find((m) => m.id === memberId);
    await supabase.from("period_records").insert({
      member_id: memberId,
      coach_id: member?.coach_id || session.user.id,
      period_date: payload.period_date,
      note: payload.note || "",
    });
  };

  const deletePeriodRecord = async (id) => {
    await supabase.from("period_records").delete().eq("id", id);
  };

  /* ---- Mutations: Member photos(合約照片 / Inbody・體態照,不限張數) ---- */
  const addMemberPhoto = async (memberId, payload) => {
    const member = members.find((m) => m.id === memberId);
    await supabase.from("member_photos").insert({
      member_id: memberId,
      coach_id: member?.coach_id || session.user.id,
      photo_type: payload.photo_type,
      file_path: payload.file_path,
      photo_date: payload.photo_date || todayStr(),
      note: payload.note || "",
    });
  };

  const deleteMemberPhoto = async (id) => {
    await supabase.from("member_photos").delete().eq("id", id);
  };

  const updateMemberPhoto = async (id, updates) => {
    await supabase.from("member_photos").update(updates).eq("id", id);
  };

  // Storage upload helper (used directly by FileUploadSlot via supabase client)
  const uploadFile = async () => {};

  if (session === undefined) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (profile === null) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  // 小編登入後,尚未選擇要查看哪位教練時,顯示選擇畫面;選定後才能進入系統其餘畫面
  if (isStaff && !selectedCoachId) {
    return (
      <CoachPickerScreen
        coaches={coaches}
        profile={profile}
        onSelect={(id) => setSelectedCoachId(id)}
        onLogout={handleLogout}
      />
    );
  }

  // 依目前範圍(教練自己,或小編選定的教練)篩選所有資料,確保畫面只顯示該教練的資料
  const scopedMembers = scopeCoachId ? members.filter((m) => m.coach_id === scopeCoachId) : members;
  const scopedMemberIds = new Set(scopedMembers.map((m) => m.id));
  const scopedSessions = scopeCoachId ? sessions.filter((s) => s.coach_id === scopeCoachId) : sessions;
  const scopedPayments = scopeCoachId ? payments.filter((p) => scopedMemberIds.has(p.member_id)) : payments;
  const scopedBodyRecords = scopeCoachId ? bodyRecords.filter((b) => scopedMemberIds.has(b.member_id)) : bodyRecords;
  const scopedVenues = scopeCoachId ? venues.filter((v) => v.coach_id === scopeCoachId) : venues;
  const scopedBlockedTimes = scopeCoachId ? blockedTimes.filter((b) => b.coach_id === scopeCoachId) : blockedTimes;
  const scopedManualCharges = scopeCoachId ? manualCharges.filter((c) => scopedMemberIds.has(c.member_id)) : manualCharges;
  const scopedPeriodRecords = scopeCoachId ? periodRecords.filter((r) => scopedMemberIds.has(r.member_id)) : periodRecords;
  const scopedMemberPhotos = scopeCoachId ? memberPhotos.filter((p) => scopedMemberIds.has(p.member_id)) : memberPhotos;
  const scopedPurchaseRecords = scopeCoachId ? purchaseRecords.filter((r) => scopedMemberIds.has(r.member_id)) : purchaseRecords;
  const scopedVenueIds = new Set((scopeCoachId ? venues.filter((v) => v.coach_id === scopeCoachId) : venues).map((v) => v.id));
  const scopedVenuePurchaseRecords = scopeCoachId ? venuePurchaseRecords.filter((r) => scopedVenueIds.has(r.venue_id)) : venuePurchaseRecords;
  const scopedMiscExpenses = scopeCoachId ? miscExpenses.filter((e) => e.coach_id === scopeCoachId) : miscExpenses;

  // 全域統計數字,傳給排課管理頁面在上方顯示
  const globalStats = {
    pending: scopedSessions.filter((s) => s.status === "scheduled").length,
    completed: scopedSessions.filter((s) => s.status === "completed").length,
    totalRemaining: scopedMembers.reduce((sum, m) => m.member_type === "member" ? sum + Math.max(m.total_sessions - m.used_sessions, 0) : sum, 0),
    activeMemberCount: scopedMembers.filter((m) => m.member_type === "member" && Math.max(m.total_sessions - m.used_sessions, 0) > 0).length,
  };

  const activeMember = activeSession ? scopedMembers.find((m) => m.id === activeSession.member_id) : null;

  const selectedCoach = isStaff ? coaches.find((c) => c.id === selectedCoachId) : null;
  const brandTitle = isStaff
    ? `${selectedCoach?.full_name || ""}教練排課系統(小編檢視)`
    : profile?.role === "coach" && profile?.full_name
    ? `${profile.full_name}教練排課系統`
    : "健身教練排課系統";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-mark">健</div>
          <span>{brandTitle}</span>
        </div>
        <div className="topbar-user">
          {isStaff && (
            <button className="btn-secondary small" onClick={() => setShowCoachSwitcher(true)}>
              切換教練
            </button>
          )}
          <span className="user-chip">
            {profile?.full_name || session.user.email}
            <span className="role-tag">{profile?.role === "coach" ? "教練" : profile?.role === "staff" ? "小編" : ""}</span>
          </span>
          <button className="icon-btn" onClick={handleLogout} title="登出">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {showCoachSwitcher && (
        <div className="modal-overlay" onClick={() => setShowCoachSwitcher(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>切換教練</h3>
              <button className="icon-btn" onClick={() => setShowCoachSwitcher(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="coach-picker-list">
              {coaches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`coach-picker-item ${c.id === selectedCoachId ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCoachId(c.id);
                    setShowCoachSwitcher(false);
                  }}
                >
                  <span className="coach-picker-name">{c.full_name}</span>
                  {c.id === selectedCoachId ? <CheckCircle2 size={18} className="coach-picker-check" /> : <ChevronRight size={18} className="row-arrow" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loadError && (
        <div className="banner-error">資料讀取失敗:{loadError}。請確認 Supabase 資料表與權限設定。</div>
      )}

      <main className="main-content">
        {activeTab === "overview" && (
          <Overview
            members={scopedMembers}
            sessions={scopedSessions}
            payments={scopedPayments}
            onGoSchedule={() => setActiveTab("schedule")}
            onOpenSession={setActiveSession}
            onOpenMember={(memberId) => {
              setOpenMemberId(memberId);
              setActiveTab("members");
            }}
          />
        )}
        {activeTab === "schedule" && (
          <ScheduleManager
            members={scopedMembers}
            sessions={scopedSessions}
            onAdd={addSession}
            onOpenSession={setActiveSession}
            presetMemberId={presetMemberId}
            onPresetUsed={() => setPresetMemberId(null)}
            venues={scopedVenues}
            blockedTimes={scopedBlockedTimes}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            globalStats={globalStats}
          />
        )}
        {activeTab === "members" && (
          <MembersManager
            members={scopedMembers}
            sessions={scopedSessions}
            payments={scopedPayments}
            bodyRecords={scopedBodyRecords}
            manualCharges={scopedManualCharges}
            periodRecords={scopedPeriodRecords}
            memberPhotos={scopedMemberPhotos}
            purchaseRecords={scopedPurchaseRecords}
            coaches={coaches}
            isStaff={isStaff}
            currentCoachId={scopeCoachId || session.user.id}
            onAddMember={addMember}
            onUpdateMember={updateMember}
            onDeleteMember={deleteMember}
            onPurchase={purchaseMore}
            onSchedule={(memberId) => {
              setPresetMemberId(memberId);
              setActiveTab("schedule");
            }}
            onAddPayment={addPayment}
            onUpdatePayment={updatePayment}
            onDeletePayment={deletePayment}
            onAddBodyRecord={addBodyRecord}
            onUpdateBodyRecord={updateBodyRecord}
            onUploadFile={uploadFile}
            onAddManualCharge={addManualCharge}
            onDeleteManualCharge={deleteManualCharge}
            onAddPeriodRecord={addPeriodRecord}
            onDeletePeriodRecord={deletePeriodRecord}
            onAddMemberPhoto={addMemberPhoto}
            onDeleteMemberPhoto={deleteMemberPhoto}
            onUpdateMemberPhoto={updateMemberPhoto}
            onDeletePurchaseRecord={deletePurchaseRecord}
            onOpenSession={setActiveSession}
            openMemberId={openMemberId}
            onMemberDetailHandled={() => setOpenMemberId(null)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {activeTab === "calendar" && (
          <CalendarView
            members={scopedMembers}
            sessions={scopedSessions}
            blockedTimes={scopedBlockedTimes}
            isStaff={isStaff}
            currentCoachId={scopeCoachId || session.user.id}
            coaches={coaches}
            onOpenSession={setActiveSession}
            onAddBlockedTime={addBlockedTime}
            onDeleteBlockedTime={deleteBlockedTime}
            onUpdateBlockedTime={updateBlockedTime}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {activeTab === "cashflow" && (
          <CashflowManager
            members={scopedMembers}
            sessions={scopedSessions}
            payments={scopedPayments}
            manualCharges={scopedManualCharges}
            venues={scopedVenues}
            venuePurchaseRecords={scopedVenuePurchaseRecords}
            purchaseRecords={scopedPurchaseRecords}
            miscExpenses={scopedMiscExpenses}
            coaches={coaches}
            isStaff={isStaff}
            currentCoachId={scopeCoachId || session.user.id}
            onAddVenue={addVenue}
            onUpdateVenue={updateVenue}
            onDeleteVenue={deleteVenue}
            onPurchaseVenue={purchaseVenueSessions}
            onDeleteVenuePurchaseRecord={deleteVenuePurchaseRecord}
            onAddMiscExpense={addMiscExpense}
            onDeleteMiscExpense={deleteMiscExpense}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} className={`nav-item ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              <Icon size={20} strokeWidth={activeTab === tab.key ? 2.4 : 2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeSession && (
        <SessionModal
          session={activeSession}
          member={activeMember}
          venues={scopedVenues}
          sessions={scopedSessions}
          onClose={() => setActiveSession(null)}
          onSave={saveSession}
          onDelete={deleteSession}
        />
      )}
    </div>
  );
}

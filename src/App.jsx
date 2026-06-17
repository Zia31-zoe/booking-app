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
  FileText,
  CheckCircle2,
  ArrowRightCircle,
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
  { key: "schedule", label: "排課管理", icon: CalendarPlus },
  { key: "members", label: "學員管理", icon: Users },
  { key: "calendar", label: "行事曆", icon: CalendarDays },
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
          教練只會看到自己的學員資料,小編可查看所有教練的學員。
        </div>
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

// 檢查某教練在指定日期/時間/時長排課是否會衝突
// 回傳 null 表示無衝突,否則回傳衝突原因字串
function findScheduleConflict({ coachId, date, startTime, durationMin, sessions, blockedTimes, excludeSessionId }) {
  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + Number(durationMin || 0);

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
function Overview({ members, sessions, payments, onGoSchedule, onOpenSession, onOpenMember }) {
  const today = todayStr();
  const tomorrow = dateStrAdd(today, 1);
  const cutoff = dateStrAdd(today, 2); // 48小時內 ≈ 今天+明天

  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  const stats = useMemo(() => {
    const pending = sessions.filter((s) => s.status === "scheduled").length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const totalRemaining = members.reduce(
      (sum, m) => (m.member_type === "member" ? sum + Math.max(m.total_sessions - m.used_sessions, 0) : sum),
      0
    );
    return { pending, completed, totalRemaining };
  }, [members, sessions]);

  // 48小時內(今天 + 明天)即將上課,分組
  const upcomingGroups = useMemo(() => {
    const inRange = sessions
      .filter((s) => s.status === "scheduled" && s.session_date >= today && s.session_date < cutoff)
      .sort((a, b) => (a.session_date + a.start_time).localeCompare(b.session_date + b.start_time));

    const todayList = inRange.filter((s) => s.session_date === today);
    const tomorrowList = inRange.filter((s) => s.session_date === tomorrow);
    return { todayList, tomorrowList };
  }, [sessions, today, tomorrow, cutoff]);

  // 學員提醒(Inbody / 生理期)— 只針對「有排定課程」的學員
  const memberAlertMap = useMemo(() => {
    const scheduledMemberIds = new Set(
      sessions.filter((s) => s.status === "scheduled" && s.session_date >= today).map((s) => s.member_id)
    );
    const map = {};
    members.forEach((m) => {
      if (!scheduledMemberIds.has(m.id)) return;
      const inbody = inbodyReminderStatus(m, today);
      const period = menstrualReminderStatus(m, today);
      if (inbody || period) {
        map[m.id] = { inbody, period };
      }
    });
    return map;
  }, [members, sessions, today]);

  // 付款提醒
  const paymentReminders = useMemo(() => {
    return payments
      .map((p) => ({ payment: p, due: paymentDueStatus(p.due_date, p.is_paid, today) }))
      .filter((x) => x.due)
      .sort((a, b) => (a.payment.due_date || "").localeCompare(b.payment.due_date || ""));
  }, [payments, today]);

  const renderSessionRow = (s) => {
    const member = memberMap[s.member_id];
    const isTrial = member?.member_type === "trial";
    const alert = memberAlertMap[s.member_id];
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
            {!s.deduct_session && <span className="pill pill-free">不扣課</span>}
            {alert?.inbody && <span className="inline-alert-text"> · 需拍攝 Inbody/體態照</span>}
            {alert?.period && <span className="inline-alert-text"> · 生理期將至,留意調整訓練</span>}
          </span>
          <span className="list-row-sub">
            {s.start_time} · {s.duration_min} 分鐘
            {s.location ? ` · ${s.location}` : ""}
          </span>
        </div>
        <ChevronRight size={18} className="row-arrow" />
      </button>
    );
  };

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

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">待上課堂</span>
          <span className="stat-value accent">{stats.pending}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">已完成課堂</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">學員剩餘總堂數</span>
          <span className="stat-value">{stats.totalRemaining}</span>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <CalendarDays size={18} />
          <h2>即將上課(48小時內)</h2>
        </div>

        <div className="upcoming-group">
          <h3 className="upcoming-group-title">今天</h3>
          {upcomingGroups.todayList.length === 0 ? (
            <div className="empty-block small">今天沒有排定的課堂。</div>
          ) : (
            <div className="list">{upcomingGroups.todayList.map(renderSessionRow)}</div>
          )}
        </div>

        <div className="upcoming-group">
          <h3 className="upcoming-group-title">明天</h3>
          {upcomingGroups.tomorrowList.length === 0 ? (
            <div className="empty-block small">明天沒有排定的課堂。</div>
          ) : (
            <div className="list">{upcomingGroups.tomorrowList.map(renderSessionRow)}</div>
          )}
        </div>
      </div>

      {paymentReminders.length > 0 && (
        <div className="section">
          <div className="section-head alert-head">
            <Bell size={18} />
            <h2>付款提醒</h2>
          </div>
          <div className="list">
            {paymentReminders.map(({ payment, due }) => {
              const member = memberMap[payment.member_id];
              return (
                <button
                  key={payment.id}
                  className="list-row clickable alert-row"
                  onClick={() => onOpenMember(payment.member_id)}
                >
                  <div className="list-row-main">
                    <span className="list-row-title alert-text">
                      {member?.name || "未知學員"} · 第 {payment.installment_no}/{payment.installment_total} 期
                    </span>
                    <span className="list-row-sub">
                      應付日:{fmtDate(payment.due_date)} · {fmtMoney(payment.amount)}
                    </span>
                  </div>
                  <span className={`pill ${due === "overdue" ? "pill-warn" : "pill-due"}`}>
                    {due === "overdue" ? "已逾期" : "即將到期"}
                  </span>
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
function ScheduleManager({ members, sessions, onAdd, onOpenSession, presetMemberId, onPresetUsed, venues, blockedTimes }) {
  const [showForm, setShowForm] = useState(!!presetMemberId);
  const [memberId, setMemberId] = useState(presetMemberId || "");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [deductSession, setDeductSession] = useState(true);
  const [error, setError] = useState("");

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

  const upcoming = useMemo(() => {
    return sessions
      .filter((s) => s.status === "scheduled")
      .sort((a, b) => (a.session_date + a.start_time).localeCompare(b.session_date + b.start_time));
  }, [sessions]);

  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  const resetForm = () => {
    setShowForm(false);
    setMemberId("");
    setDate(todayStr());
    setTime("10:00");
    setDuration(60);
    setLocation("");
    setDeductSession(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!memberId) {
      setError("請選擇學員");
      return;
    }
    const member = members.find((m) => m.id === memberId);
    if (member?.member_type === "member" && deductSession && member.used_sessions >= member.total_sessions) {
      setError("此學員已無剩餘堂數,請先為學員購課,或取消勾選「扣課」");
      return;
    }
    if (member?.coach_id) {
      const conflict = findScheduleConflict({
        coachId: member.coach_id,
        date,
        startTime: time,
        durationMin: duration,
        sessions,
        blockedTimes,
      });
      if (conflict) {
        setError(`無法排課:${conflict}`);
        return;
      }
    }
    await onAdd({
      member_id: memberId,
      session_date: date,
      start_time: time,
      duration_min: Number(duration),
      location: location.trim(),
      deduct_session: member?.member_type === "trial" ? false : deductSession,
    });
    resetForm();
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
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </label>
            <label>
              時長(分鐘)
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value={60}>60</option>
                <option value={75}>75</option>
                <option value={90}>90</option>
                <option value={105}>105</option>
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

          {selectedMember?.member_type === "member" && (
            <label className="checkbox-row">
              <input type="checkbox" checked={deductSession} onChange={(e) => setDeductSession(e.target.checked)} />
              此堂扣除學員堂數
            </label>
          )}
          {selectedMember?.member_type === "trial" && (
            <div className="hint-box">體驗課不會計入堂數。</div>
          )}

          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-primary full">
            確認排課
          </button>
        </form>
      )}

      <div className="section">
        <div className="section-head">
          <Clock size={18} />
          <h2>排定中的課堂</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-block">目前沒有排定中的課堂。</div>
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
function SessionModal({ session, member, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    warmup: session.warmup || "",
    main_training: session.main_training || "",
    cooldown: session.cooldown || "",
    coach_notes: session.coach_notes || "",
    energy_rating: session.energy_rating || 0,
    soreness_rating: session.soreness_rating || 0,
    mood_rating: session.mood_rating || 0,
    member_feedback: session.member_feedback || "",
  });
  const [saving, setSaving] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async (markCompleted) => {
    setSaving(true);
    await onSave(session.id, { ...form, markCompleted });
    setSaving(false);
    onClose();
  };

  const isCompleted = session.status === "completed";
  const isTrial = member?.member_type === "trial";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{member?.name || "未知學員"} 的訓練記錄</h3>
            <p className="modal-sub">
              {fmtDate(session.session_date)} · {session.start_time} · {session.duration_min} 分鐘
              {session.location ? ` · ${session.location}` : ""}
              {isTrial && <span className="pill pill-trial">體驗課</span>}
              {!session.deduct_session && !isTrial && <span className="pill pill-free">不扣課</span>}
              {isCompleted && <span className="pill pill-done">已完成</span>}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <label className="block-label">
            熱身
            <textarea rows={2} value={form.warmup} onChange={(e) => update("warmup", e.target.value)} placeholder="例如:動態伸展 5 分鐘、滾筒放鬆" />
          </label>
          <label className="block-label">
            主訓練
            <textarea rows={3} value={form.main_training} onChange={(e) => update("main_training", e.target.value)} placeholder="例如:深蹲 4x8、臥推 4x8、引體向上 3x10" />
          </label>
          <label className="block-label">
            收操
            <textarea rows={2} value={form.cooldown} onChange={(e) => update("cooldown", e.target.value)} placeholder="例如:靜態伸展、呼吸放鬆 5 分鐘" />
          </label>
          <label className="block-label">
            教練筆記
            <textarea rows={2} value={form.coach_notes} onChange={(e) => update("coach_notes", e.target.value)} placeholder="給下次課程的提醒、動作修正建議等" />
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

        <div className="modal-footer">
          <button className="btn-danger" onClick={() => onDelete(session.id)}>
            刪除課堂
          </button>
          <div className="spacer" />
          <button className="btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
            儲存草稿
          </button>
          <button className="btn-primary" onClick={() => handleSave(true)} disabled={saving}>
            {isCompleted ? "更新紀錄" : "完成課堂並儲存"}
          </button>
        </div>
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
  openMemberId,
  onMemberDetailHandled,
}) {
  const [showForm, setShowForm] = useState(false);
  const [detailFor, setDetailFor] = useState(null);
  const [purchaseFor, setPurchaseFor] = useState(null);

  const regularMembers = members.filter((m) => m.member_type === "member");
  const trialMembers = members.filter((m) => m.member_type === "trial");

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
          onClose={() => setDetailFor(null)}
          onUpdateMember={onUpdateMember}
          onDeleteMember={onDeleteMember}
          onAddPayment={onAddPayment}
          onUpdatePayment={onUpdatePayment}
          onDeletePayment={onDeletePayment}
          onAddBodyRecord={onAddBodyRecord}
          onUpdateBodyRecord={onUpdateBodyRecord}
          onUploadFile={onUploadFile}
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
        <div className="form-grid">
          <label>
            聯絡電話
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="選填" />
          </label>
          <label>
            首次購買堂數
            <input type="number" min={0} value={packageSize} onChange={(e) => setPackageSize(e.target.value)} required />
          </label>
          <label>
            單堂課金額
            <input type="number" min={0} value={pricePerSession} onChange={(e) => setPricePerSession(e.target.value)} placeholder="選填" />
          </label>
        </div>
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
              <input type="time" value={trialTime} onChange={(e) => setTrialTime(e.target.value)} required />
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
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onPurchase(member.id, Number(sessionsAdded), amount === "" ? 0 : Number(amount));
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
            <input type="number" min={0} value={sessionsAdded} onChange={(e) => setSessionsAdded(e.target.value)} required />
          </label>
          <label>
            收款金額(元)
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="選填,會記錄到金流" />
          </label>
          <p className="modal-hint">
            目前總堂數 {member.total_sessions} → 加購後 {member.total_sessions + Number(sessionsAdded || 0)}
          </p>
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
  { key: "history", label: "訓練紀錄" },
];

function MemberDetailModal({
  member,
  sessions,
  payments,
  bodyRecords,
  onClose,
  onUpdateMember,
  onDeleteMember,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onAddBodyRecord,
  onUpdateBodyRecord,
  onUploadFile,
}) {
  const [tab, setTab] = useState("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const completedSessions = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => (b.session_date + b.start_time).localeCompare(a.session_date + a.start_time));

  const totalPaid = payments.filter((p) => p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCourseFee = member.price_per_session * member.total_sessions;
  const remainingUnpaid = Math.max(totalCourseFee - totalPaid, totalDue - totalPaid, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{member.name}</h3>
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
            <ProfileTab member={member} onUpdateMember={onUpdateMember} onUploadFile={onUploadFile} />
          )}

          {tab === "body" && (
            <BodyTab
              member={member}
              bodyRecords={bodyRecords}
              onUpdateMember={onUpdateMember}
              onAddBodyRecord={onAddBodyRecord}
              onUpdateBodyRecord={onUpdateBodyRecord}
              onUploadFile={onUploadFile}
            />
          )}

          {tab === "payment" && (
            <PaymentTab
              member={member}
              payments={payments}
              totalPaid={totalPaid}
              totalCourseFee={totalCourseFee}
              remainingUnpaid={remainingUnpaid}
              onAddPayment={onAddPayment}
              onUpdatePayment={onUpdatePayment}
              onDeletePayment={onDeletePayment}
            />
          )}

          {tab === "history" && (
            <div className="section">
              {completedSessions.length === 0 ? (
                <div className="empty-block">尚無已完成的課堂紀錄。</div>
              ) : (
                <div className="list">
                  {completedSessions.map((s) => (
                    <div className="history-row" key={s.id}>
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
function ProfileTab({ member, onUpdateMember, onUploadFile }) {
  const [form, setForm] = useState({
    training_goal: member.training_goal || "",
    health_notes: member.health_notes || "",
    coach_notes: member.coach_notes || "",
    price_per_session: member.price_per_session || 0,
    phone: member.phone || "",
    track_menstrual_cycle: member.track_menstrual_cycle || false,
    last_period_date: member.last_period_date || "",
    cycle_length_days: member.cycle_length_days || 28,
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await onUpdateMember(member.id, {
      training_goal: form.training_goal,
      health_notes: form.health_notes,
      coach_notes: form.coach_notes,
      price_per_session: Number(form.price_per_session) || 0,
      phone: form.phone,
      track_menstrual_cycle: form.track_menstrual_cycle,
      last_period_date: form.last_period_date || null,
      cycle_length_days: Number(form.cycle_length_days) || 28,
    });
    setSaving(false);
    setSavedAt(Date.now());
  };

  const handleContractUpload = async (path) => {
    await onUpdateMember(member.id, { contract_file_path: path });
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

      <label className="block-label">
        單堂課金額(元)
        <input type="number" min={0} value={form.price_per_session} onChange={(e) => update("price_per_session", e.target.value)} />
      </label>

      <div className="divider" />

      <h4 className="section-title-sm">生理週期紀錄(女學員)</h4>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.track_menstrual_cycle} onChange={(e) => update("track_menstrual_cycle", e.target.checked)} />
        追蹤生理週期(經期前3天會在總覽提醒教練調整訓練)
      </label>
      {form.track_menstrual_cycle && (
        <div className="form-grid">
          <label>
            最近一次月經來潮日期
            <input type="date" value={form.last_period_date} onChange={(e) => update("last_period_date", e.target.value)} />
          </label>
          <label>
            週期天數
            <input type="number" min={20} max={45} value={form.cycle_length_days} onChange={(e) => update("cycle_length_days", e.target.value)} />
          </label>
        </div>
      )}

      <div className="divider" />

      <FileUploadSlot
        label="學員合約照片"
        path={member.contract_file_path}
        onUploaded={handleContractUpload}
        onRemove={() => onUpdateMember(member.id, { contract_file_path: null })}
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
function BodyTab({ member, bodyRecords, onUpdateMember, onAddBodyRecord, onUpdateBodyRecord, onUploadFile }) {
  const [creating, setCreating] = useState(false);

  const sorted = bodyRecords.slice().sort((a, b) => b.record_date.localeCompare(a.record_date));
  const latest = sorted[0];

  const today = todayStr();
  const status = inbodyReminderStatus(member, today);

  const handleCreate = async () => {
    setCreating(true);
    const rec = await onAddBodyRecord(member.id, { record_date: todayStr() });
    if (rec) {
      await onUpdateMember(member.id, { last_inbody_date: todayStr() });
    }
    setCreating(false);
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

      <button className="btn-primary" onClick={handleCreate} disabled={creating}>
        <Plus size={16} /> 新增本次記錄
      </button>

      {sorted.length === 0 ? (
        <div className="empty-block">尚無 Inbody / 體態照紀錄。</div>
      ) : (
        <div className="body-record-list">
          {sorted.map((rec) => (
            <BodyRecordCard
              key={rec.id}
              record={rec}
              onUpdate={(updates) => onUpdateBodyRecord(rec.id, updates)}
              onUploadFile={onUploadFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BodyRecordCard({ record, onUpdate }) {
  return (
    <div className="body-record-card">
      <div className="body-record-head">
        <span className="list-row-title">{fmtDate(record.record_date)}</span>
      </div>
      <div className="body-record-grid">
        <FileUploadSlot
          label="Inbody 報告"
          path={record.inbody_file_path}
          onUploaded={(p) => onUpdate({ inbody_file_path: p })}
          onRemove={() => onUpdate({ inbody_file_path: null })}
        />
        <FileUploadSlot
          label="正面"
          path={record.front_file_path}
          onUploaded={(p) => onUpdate({ front_file_path: p })}
          onRemove={() => onUpdate({ front_file_path: null })}
        />
        <FileUploadSlot
          label="側面"
          path={record.side_file_path}
          onUploaded={(p) => onUpdate({ side_file_path: p })}
          onRemove={() => onUpdate({ side_file_path: null })}
        />
        <FileUploadSlot
          label="背面"
          path={record.back_file_path}
          onUploaded={(p) => onUpdate({ back_file_path: p })}
          onRemove={() => onUpdate({ back_file_path: null })}
        />
      </div>
      <label className="block-label">
        備註
        <textarea rows={1} value={record.note || ""} onChange={(e) => onUpdate({ note: e.target.value })} />
      </label>
    </div>
  );
}

/* ---------- 繳款 Tab ---------- */
function PaymentTab({ member, payments, totalPaid, totalCourseFee, remainingUnpaid, onAddPayment, onUpdatePayment, onDeletePayment }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [method, setMethod] = useState("");
  const [installmentNo, setInstallmentNo] = useState(1);
  const [installmentTotal, setInstallmentTotal] = useState(1);

  const sorted = payments.slice().sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAddPayment(member.id, {
      amount: Number(amount),
      due_date: dueDate,
      payment_method: method.trim(),
      installment_no: Number(installmentNo),
      installment_total: Number(installmentTotal),
      is_paid: false,
    });
    setAmount("");
    setDueDate(todayStr());
    setMethod("");
    setInstallmentNo(1);
    setInstallmentTotal(1);
    setShowForm(false);
  };

  return (
    <div className="section">
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">課費總金額</span>
          <span className="stat-value">{fmtMoney(totalCourseFee)}</span>
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
              金額(元)
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <label>
              應付款日期
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </label>
            <label>
              付款方式
              <input type="text" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="例如:現金、轉帳、信用卡" />
            </label>
            <label>
              第幾期 / 共幾期
              <div className="inline-form-row">
                <input type="number" min={1} value={installmentNo} onChange={(e) => setInstallmentNo(e.target.value)} />
                <span className="inline-divider">/</span>
                <input type="number" min={1} value={installmentTotal} onChange={(e) => setInstallmentTotal(e.target.value)} />
              </div>
            </label>
          </div>
          <button type="submit" className="btn-primary full">
            新增
          </button>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="empty-block">尚無分期/付款紀錄。</div>
      ) : (
        <div className="list">
          {sorted.map((p) => (
            <div className="payment-row" key={p.id}>
              <div className="list-row-main">
                <span className="list-row-title">
                  第 {p.installment_no}/{p.installment_total} 期 · {fmtMoney(p.amount)}
                </span>
                <span className="list-row-sub">
                  應付日:{fmtDate(p.due_date)}
                  {p.payment_method ? ` · ${p.payment_method}` : ""}
                  {p.is_paid && p.paid_date ? ` · 已付於 ${fmtDate(p.paid_date)}` : ""}
                </span>
              </div>
              <div className="payment-row-actions">
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
          ))}
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
      total_sessions: Number(convertForm.total_sessions),
      used_sessions: 0,
      price_per_session: convertForm.price_per_session === "" ? 0 : Number(convertForm.price_per_session),
      trial_followup_status: "converted",
    });
    onClose();
  };

  const session = sessions[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{member.name}(體驗課)</h3>
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
                <label>
                  購買堂數
                  <input
                    type="number"
                    min={1}
                    value={convertForm.total_sessions}
                    onChange={(e) => setConvertForm((f) => ({ ...f, total_sessions: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  單堂課金額
                  <input
                    type="number"
                    min={0}
                    value={convertForm.price_per_session}
                    onChange={(e) => setConvertForm((f) => ({ ...f, price_per_session: e.target.value }))}
                    placeholder="選填"
                  />
                </label>
              </div>
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
const CAL_START_HOUR = 6; // 行事曆顯示起始時間
const CAL_END_HOUR = 23; // 行事曆顯示結束時間(不含)
const CAL_HOUR_HEIGHT = 56; // 每小時的像素高度

function CalendarView({ members, sessions, blockedTimes, isStaff, currentCoachId, coaches, onOpenSession, onAddBlockedTime, onDeleteBlockedTime }) {
  const [weekStart, setWeekStart] = useState(() => {
    const today = todayStr();
    const wd = weekdayOf(today);
    return dateStrAdd(today, -wd); // 該週的週日
  });
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [filterCoachId, setFilterCoachId] = useState(isStaff ? "" : currentCoachId);

  const memberMap = useMemo(() => {
    const map = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => dateStrAdd(weekStart, i));
  }, [weekStart]);

  const today = todayStr();

  // 篩選後的課堂(依教練篩選,小編可選擇查看哪位教練)
  const visibleSessions = useMemo(() => {
    return sessions.filter((s) => s.status === "scheduled" && (!filterCoachId || s.coach_id === filterCoachId));
  }, [sessions, filterCoachId]);

  const visibleBlockedTimes = useMemo(() => {
    return (blockedTimes || []).filter((b) => !filterCoachId || b.coach_id === filterCoachId);
  }, [blockedTimes, filterCoachId]);

  // 當天的課堂,依時間排序
  const dayList = useMemo(() => {
    return visibleSessions
      .filter((s) => s.session_date === selectedDate)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [visibleSessions, selectedDate]);

  // 當天的不可排課時段(含單次與每週固定)
  const dayBlocks = useMemo(() => {
    const wd = weekdayOf(selectedDate);
    return visibleBlockedTimes.filter(
      (b) => (b.block_date && b.block_date === selectedDate) || (b.weekday !== null && b.weekday !== undefined && Number(b.weekday) === wd)
    );
  }, [visibleBlockedTimes, selectedDate]);

  const hours = Array.from({ length: CAL_END_HOUR - CAL_START_HOUR }, (_, i) => CAL_START_HOUR + i);

  const blockTop = (startTime) => {
    const mins = timeToMinutes(startTime) - CAL_START_HOUR * 60;
    return (mins / 60) * CAL_HOUR_HEIGHT;
  };
  const blockHeight = (durationMin) => Math.max((Number(durationMin) / 60) * CAL_HOUR_HEIGHT, 28);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>行事曆</h1>
          <p className="page-sub">檢視本週排定的課堂與不可排課時段</p>
        </div>
        <button className="btn-primary" onClick={() => setShowBlockForm((v) => !v)}>
          {showBlockForm ? <X size={16} /> : <Plus size={16} />}
          {showBlockForm ? "取消" : "設定不可排課時段"}
        </button>
      </div>

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

      {visibleBlockedTimes.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Bell size={18} />
            <h2>已設定的不可排課時段</h2>
          </div>
          <div className="list">
            {visibleBlockedTimes.map((b) => (
              <div className="list-row" key={b.id}>
                <div className="list-row-main">
                  <span className="list-row-title">
                    {b.label || "不可排課"}
                    {b.weekday !== null && b.weekday !== undefined ? (
                      <span className="pill pill-muted">每週{WEEKDAY_LABELS[b.weekday]}</span>
                    ) : (
                      <span className="pill pill-muted">{fmtDate(b.block_date)}</span>
                    )}
                  </span>
                  <span className="list-row-sub">{b.start_time} - {b.end_time}</span>
                </div>
                <button className="icon-btn" onClick={() => onDeleteBlockedTime(b.id)} title="刪除">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <CalendarDays size={18} />
          <h2>{weekDates[0].slice(0, 4)} 年 {Number(weekDates[0].slice(5, 7))} 月 {Number(weekDates[0].slice(8, 10))} 日 - {Number(weekDates[6].slice(8, 10))} 日</h2>
        </div>

        <div className="cal-week-nav">
          <button className="icon-btn" onClick={() => setWeekStart((d) => dateStrAdd(d, -7))}>
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn-secondary small"
            onClick={() => {
              const t = todayStr();
              setWeekStart(dateStrAdd(t, -weekdayOf(t)));
              setSelectedDate(t);
            }}
          >
            本週
          </button>
          <button className="icon-btn" onClick={() => setWeekStart((d) => dateStrAdd(d, 7))}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="cal-day-tabs">
          {weekDates.map((d) => {
            const wd = weekdayOf(d);
            const isToday = d === today;
            const isSelected = d === selectedDate;
            const dayNum = Number(d.slice(8, 10));
            const hasSessions = visibleSessions.some((s) => s.session_date === d);
            return (
              <button
                key={d}
                className={`cal-day-tab ${isSelected ? "active" : ""} ${isToday ? "today" : ""}`}
                onClick={() => setSelectedDate(d)}
              >
                <span className="cal-day-weekday">{WEEKDAY_LABELS[wd]}</span>
                <span className="cal-day-num">{dayNum}</span>
                {hasSessions && <span className="cal-day-dot" />}
              </button>
            );
          })}
        </div>

        <div className="cal-timeline-wrap">
          <div className="cal-timeline" style={{ height: `${(CAL_END_HOUR - CAL_START_HOUR) * CAL_HOUR_HEIGHT}px` }}>
            {hours.map((h) => (
              <div key={h} className="cal-hour-row" style={{ height: `${CAL_HOUR_HEIGHT}px` }}>
                <span className="cal-hour-label">{pad2(h)}:00</span>
              </div>
            ))}

            {dayBlocks.map((b, i) => {
              const top = blockTop(b.start_time);
              const height = Math.max(blockTop(b.end_time) - top, 20);
              return (
                <div
                  key={`block-${b.id || i}`}
                  className="cal-block cal-block-unavailable"
                  style={{ top: `${top}px`, height: `${height}px` }}
                >
                  {b.label || "不可排課"} · {b.start_time}-{b.end_time}
                </div>
              );
            })}

            {dayList.map((s) => {
              const member = memberMap[s.member_id];
              const isTrial = member?.member_type === "trial";
              const top = blockTop(s.start_time);
              const height = blockHeight(s.duration_min);
              return (
                <button
                  key={s.id}
                  className={`cal-block cal-block-session ${isTrial ? "trial" : "member"}`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  onClick={() => onOpenSession(s)}
                >
                  <span className="cal-block-title">{member?.name || "未知學員"}</span>
                  <span className="cal-block-time">{s.start_time} · {s.duration_min}分</span>
                </button>
              );
            })}
          </div>
        </div>

        {dayList.length === 0 && dayBlocks.length === 0 && (
          <div className="empty-block small">這天沒有排定的課堂或不可排課時段。</div>
        )}
      </div>
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

/* ============================================================
   金流紀錄
   ============================================================ */
function CashflowManager({ members, payments, venues, coaches, isStaff, currentCoachId, onAddVenue, onUpdateVenue, onDeleteVenue, onPurchaseVenue }) {
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venuePurchaseFor, setVenuePurchaseFor] = useState(null);
  const [editingVenueId, setEditingVenueId] = useState(null);

  const regularMembers = members.filter((m) => m.member_type === "member");
  const trialMembers = members.filter((m) => m.member_type === "trial");

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

  const summary = useMemo(() => {
    let totalUnfinishedSessions = 0;
    let totalUnfinishedFee = 0;
    let totalCourseFee = 0;
    let totalPaid = 0;
    let totalUnpaidFromInstallments = 0;

    const perMember = regularMembers.map((m) => {
      const remaining = Math.max(m.total_sessions - m.used_sessions, 0);
      const unfinishedFee = remaining * (m.price_per_session || 0);
      const courseFee = m.total_sessions * (m.price_per_session || 0);
      const memberPayments = payments.filter((p) => p.member_id === m.id);
      const paid = memberPayments.filter((p) => p.is_paid).reduce((sum, p) => sum + Number(p.amount), 0);
      const installmentTotal = memberPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const unpaid = Math.max(courseFee - paid, installmentTotal - paid, 0);

      totalUnfinishedSessions += remaining;
      totalUnfinishedFee += unfinishedFee;
      totalCourseFee += courseFee;
      totalPaid += paid;
      totalUnpaidFromInstallments += unpaid;

      return { member: m, remaining, unfinishedFee, courseFee, paid, unpaid, payments: memberPayments };
    });

    const trialFeeTotal = trialMembers.reduce((sum, m) => sum + Number(m.trial_fee || 0), 0);

    return {
      totalUnfinishedSessions,
      totalUnfinishedFee,
      totalCourseFee,
      totalPaid,
      totalUnpaidFromInstallments,
      perMember,
      trialFeeTotal,
    };
  }, [regularMembers, trialMembers, payments]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>金流紀錄</h1>
          <p className="page-sub">學員課費與分期付款總覽</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">學員未完成課程數</span>
          <span className="stat-value accent">{summary.totalUnfinishedSessions}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">未完成課程課費總額</span>
          <span className="stat-value">{fmtMoney(summary.totalUnfinishedFee)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">課費總金額</span>
          <span className="stat-value">{fmtMoney(summary.totalCourseFee)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">已收金額</span>
          <span className="stat-value accent">{fmtMoney(summary.totalPaid)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">未收取課費總額</span>
          <span className="stat-value warn">{fmtMoney(summary.totalUnpaidFromInstallments)}</span>
        </div>
        {summary.trialFeeTotal > 0 && (
          <div className="stat-card">
            <span className="stat-label">體驗課課費總額</span>
            <span className="stat-value">{fmtMoney(summary.trialFeeTotal)}</span>
          </div>
        )}
        {venueSummary.list.length > 0 && (
          <div className="stat-card">
            <span className="stat-label">場地總支出金額</span>
            <span className="stat-value warn">{fmtMoney(venueSummary.totalSpent)}</span>
          </div>
        )}
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

      {trialMembers.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Users size={18} />
            <h2>體驗課學員課費</h2>
          </div>
          <div className="list">
            {trialMembers.map((m) => (
              <div className="list-row" key={m.id}>
                <div className="list-row-main">
                  <span className="list-row-title">
                    {m.name}
                    <span className="pill pill-trial">體驗課</span>
                  </span>
                  <span className="list-row-sub">
                    付款帳號末五碼:{m.trial_payment_last5 || "未填寫"}
                    {m.trial_fee > 0 ? ` · 課費 ${fmtMoney(m.trial_fee)}` : ""}
                  </span>
                </div>
                <span className="pill pill-muted">
                  {m.trial_followup_status === "converted" ? "已轉正式" : "追蹤中"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
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
                  <div className={`list-row venue-row ${low ? "low" : ""}`}>
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
                    <div className="venue-row-actions">
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
      </div>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onPurchase(venue.id, Number(sessionsAdded));
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
          <p className="modal-hint">
            目前總次數 {venue.total_sessions} → 新購後 {venue.total_sessions + Number(sessionsAdded || 0)}
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
   主程式
   ============================================================ */
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bodyRecords, setBodyRecords] = useState([]);
  const [venues, setVenues] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [presetMemberId, setPresetMemberId] = useState(null);
  const [openMemberId, setOpenMemberId] = useState(null);
  const [loadError, setLoadError] = useState("");

  const isStaff = profile?.role === "staff";

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
      ] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("sessions").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("body_records").select("*"),
        supabase.from("venues").select("*").order("name"),
        supabase.from("blocked_times").select("*"),
      ]);
      if (cancelled) return;
      if (mErr || sErr || pErr || bErr || vErr || btErr) {
        setLoadError((mErr || sErr || pErr || bErr || vErr || btErr).message);
        return;
      }
      setMembers(m || []);
      setSessions(s || []);
      setPayments(p || []);
      setBodyRecords(b || []);
      setVenues(v || []);
      setBlockedTimes(bt || []);
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

  const purchaseMore = async (memberId, sessionsAdded, amount = 0) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    if (sessionsAdded) {
      await supabase
        .from("members")
        .update({ total_sessions: member.total_sessions + sessionsAdded })
        .eq("id", memberId);
    }
    if (amount && amount > 0) {
      await supabase.from("payments").insert({
        member_id: memberId,
        coach_id: member.coach_id,
        amount,
        due_date: todayStr(),
        paid_date: todayStr(),
        is_paid: true,
        installment_no: 1,
        installment_total: 1,
        note: "購課收款",
      });
    }
  };

  /* ---- Mutations: Sessions ---- */
  const addSession = async ({ member_id, session_date, start_time, duration_min, location, deduct_session }) => {
    const member = members.find((m) => m.id === member_id);
    await supabase.from("sessions").insert({
      member_id,
      coach_id: member?.coach_id || session.user.id,
      session_date,
      start_time,
      duration_min,
      location: location || "",
      status: "scheduled",
      deduct_session: !!deduct_session,
    });
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
    };
    if (payload.markCompleted) update.status = "completed";

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

  const purchaseVenueSessions = async (venueId, sessionsAdded) => {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue) return;
    await supabase
      .from("venues")
      .update({ total_sessions: venue.total_sessions + Number(sessionsAdded || 0) })
      .eq("id", venueId);
  };

  /* ---- Mutations: Blocked times(不可排課時段) ---- */
  const addBlockedTime = async (payload) => {
    await supabase.from("blocked_times").insert({
      coach_id: payload.coach_id || session.user.id,
      label: payload.label || "",
      block_date: payload.block_date || null,
      weekday: payload.weekday === "" || payload.weekday === undefined ? null : Number(payload.weekday),
      start_time: payload.start_time,
      end_time: payload.end_time,
    });
  };

  const deleteBlockedTime = async (id) => {
    await supabase.from("blocked_times").delete().eq("id", id);
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

  const activeMember = activeSession ? members.find((m) => m.id === activeSession.member_id) : null;

  const brandTitle = profile?.role === "coach" && profile?.full_name ? `${profile.full_name}教練排課系統` : "健身教練排課系統";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-mark">健</div>
          <span>{brandTitle}</span>
        </div>
        <div className="topbar-user">
          <span className="user-chip">
            {profile?.full_name || session.user.email}
            <span className="role-tag">{profile?.role === "coach" ? "教練" : profile?.role === "staff" ? "小編" : ""}</span>
          </span>
          <button className="icon-btn" onClick={handleLogout} title="登出">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {loadError && (
        <div className="banner-error">資料讀取失敗:{loadError}。請確認 Supabase 資料表與權限設定。</div>
      )}

      <main className="main-content">
        {activeTab === "overview" && (
          <Overview
            members={members}
            sessions={sessions}
            payments={payments}
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
            members={members}
            sessions={sessions}
            onAdd={addSession}
            onOpenSession={setActiveSession}
            presetMemberId={presetMemberId}
            onPresetUsed={() => setPresetMemberId(null)}
            venues={venues}
            blockedTimes={blockedTimes}
          />
        )}
        {activeTab === "members" && (
          <MembersManager
            members={members}
            sessions={sessions}
            payments={payments}
            bodyRecords={bodyRecords}
            coaches={coaches}
            isStaff={isStaff}
            currentCoachId={session.user.id}
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
            openMemberId={openMemberId}
            onMemberDetailHandled={() => setOpenMemberId(null)}
          />
        )}
        {activeTab === "calendar" && (
          <CalendarView
            members={members}
            sessions={sessions}
            blockedTimes={blockedTimes}
            isStaff={isStaff}
            currentCoachId={session.user.id}
            coaches={coaches}
            onOpenSession={setActiveSession}
            onAddBlockedTime={addBlockedTime}
            onDeleteBlockedTime={deleteBlockedTime}
          />
        )}
        {activeTab === "cashflow" && (
          <CashflowManager
            members={members}
            payments={payments}
            venues={venues}
            coaches={coaches}
            isStaff={isStaff}
            currentCoachId={session.user.id}
            onAddVenue={addVenue}
            onUpdateVenue={updateVenue}
            onDeleteVenue={deleteVenue}
            onPurchaseVenue={purchaseVenueSessions}
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
          onClose={() => setActiveSession(null)}
          onSave={saveSession}
          onDelete={deleteSession}
        />
      )}
    </div>
  );
}

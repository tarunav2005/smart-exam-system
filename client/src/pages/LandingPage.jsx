import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  Shuffle,
  ShieldCheck,
  BarChart3,
  Clock,
  FileCheck2,
  Bell,
  GraduationCap,
  Users,
  BookOpen,
  Award,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Lock,
  TrendingUp,
  Menu,
  Code2,
} from "lucide-react";
import "./LandingPage.css";

import { FaLinkedin, FaXTwitter } from "react-icons/fa6";

/* ---------- Animated counter ---------- */
const Counter = ({ target, suffix = "", duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

/* ---------- Mouse-follow glow wrapper ---------- */
const GlowCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={cardRef}
      className={`glow-card ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="glow-card-shine"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(280px circle at ${x}px ${y}px, rgba(124,58,237,0.18), transparent 70%)`,
          ),
        }}
      />
      <div className="glow-card-content">{children}</div>
    </div>
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: Shuffle,
      title: "Randomized Papers",
      desc: "Every student gets a unique, shuffled paper — questions and options both randomized.",
    },
    {
      icon: ShieldCheck,
      title: "Real Anti-Cheat",
      desc: "Fullscreen lock, tab-switch detection, copy-paste block, and refresh tracking.",
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      desc: "Class averages, question accuracy, top performers, and weak-student alerts.",
    },
    {
      icon: Clock,
      title: "Live Monitoring",
      desc: "Watch exams unfold in real time — who's in progress, who's submitted.",
    },
    {
      icon: FileCheck2,
      title: "Instant Reports",
      desc: "One-click PDF scorecards, Excel exports, marksheets, and attendance reports.",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      desc: "Exam reminders, published results, and assignment alerts — automatically.",
    },
  ];

  const workflow = [
    {
      step: "01",
      title: "Faculty Creates",
      desc: "Build a question bank across 7 types, set difficulty and negative marking.",
    },
    {
      step: "02",
      title: "System Generates",
      desc: "Every student receives a uniquely randomized paper the moment they start.",
    },
    {
      step: "03",
      title: "Students Attempt",
      desc: "A secure, monitored exam experience with auto-save and live timers.",
    },
    {
      step: "04",
      title: "Instant Results",
      desc: "Auto-graded scores, ranks, and grades — available the second they submit.",
    },
  ];

  const stack = [
    "MongoDB",
    "Express.js",
    "React",
    "Node.js",
    "JWT Auth",
    "Judge0",
  ];

  const tabContent = {
    student: {
      icon: GraduationCap,
      title: "Student Dashboard",
      points: [
        "Real-time score trends & charts",
        "Subject & difficulty-wise accuracy",
        "Downloadable PDF scorecards",
        "Question-by-question review with explanations",
      ],
    },
    faculty: {
      icon: Users,
      title: "Faculty Console",
      points: [
        "Full question bank across 7 types",
        "Live exam monitoring dashboard",
        "Manual grading for subjective answers",
        "Top performers & weak-student alerts",
      ],
    },
    admin: {
      icon: BookOpen,
      title: "Admin Control",
      points: [
        "Institute, course & subject management",
        "User roles & access control",
        "System-wide analytics overview",
        "Excel bulk question import",
      ],
    },
  };

  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <motion.nav
        className={`landing-nav ${scrolled ? "scrolled" : ""}`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <img
              src="/logo.png"
              alt="ExamSphere Logo"
              className="landing-logo"
            />

            <span className="landing-brand-text">ExamSphere</span>
          </div>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">How it Works</a>
            <a href="#dashboards">Dashboards</a>
            <a href="#stack">Tech Stack</a>
          </div>

          <div className="landing-nav-actions">
            <button className="btn-ghost" onClick={() => navigate("/login")}>
              Log In
            </button>
            <button
              className="btn-shimmer"
              onClick={() => navigate("/register")}
            >
              Get Started <ArrowRight size={15} />
            </button>
          </div>

          <button
            className="landing-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="landing-mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <a href="#features" onClick={() => setMenuOpen(false)}>
                Features
              </a>
              <a href="#workflow" onClick={() => setMenuOpen(false)}>
                How it Works
              </a>
              <a href="#dashboards" onClick={() => setMenuOpen(false)}>
                Dashboards
              </a>
              <button className="btn-ghost" onClick={() => navigate("/login")}>
                Log In
              </button>
              <button
                className="btn-shimmer"
                onClick={() => navigate("/register")}
              >
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HERO */}
      <section className="landing-hero">
        <div className="hero-bg">
          <motion.div
            className="hero-blob blob-1"
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="hero-blob blob-2"
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="hero-blob blob-3"
            animate={{ x: [0, 25, 0], y: [0, 25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="hero-grid" />
          <div className="hero-particles">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.span
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{ opacity: [0, 1, 0], y: [0, -30, 0] }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>
        </div>

        <motion.div className="hero-content" style={{ y: heroY }}>
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Zap size={13} /> Full-Stack MERN Examination Platform
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
          >
            Examinations, <span className="gradient-text">reimagined</span> for
            the modern classroom
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
          >
            Randomized papers, real anti-cheat, instant auto-grading, and deep
            analytics — everything an institution needs to run secure,
            intelligent assessments online.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
          >
            <button
              className="btn-shimmer btn-lg"
              onClick={() => navigate("/register")}
            >
              Start Free <ArrowRight size={17} />
            </button>
            <button
              className="btn-outline btn-lg"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
          </motion.div>

          <motion.div
            className="hero-mockup"
            initial={{ opacity: 0, y: 60, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mockup-frame">
              <div className="mockup-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="mockup-pill active" />
                  <div className="mockup-pill" />
                  <div className="mockup-pill" />
                  <div className="mockup-pill" />
                </div>
                <div className="mockup-main">
                  <div className="mockup-stat-row">
                    <div className="mockup-stat" />
                    <div className="mockup-stat" />
                    <div className="mockup-stat" />
                    <div className="mockup-stat" />
                  </div>
                  <div className="mockup-chart" />
                </div>
              </div>
            </div>
            <motion.div
              className="mockup-float-card card-a"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Award size={18} /> <span>Score: 94%</span>
            </motion.div>
            <motion.div
              className="mockup-float-card card-b"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <ShieldCheck size={18} /> <span>0 Violations</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="landing-stats">
        {[
          { n: 7, suffix: "", label: "Question Types" },
          { n: 99, suffix: "%", label: "Uptime Reliability" },
          { n: 15, suffix: "+", label: "Core Modules" },
          { n: 100, suffix: "%", label: "Auto-Graded Objective" },
        ].map((s, i) => (
          <motion.div
            className="stat-block"
            key={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
            variants={fadeUp}
          >
            <div className="stat-number">
              <Counter target={s.n} suffix={s.suffix} />
            </div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="landing-section" id="features">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <span className="section-eyebrow">Capabilities</span>
          <h2>Everything an exam platform should be</h2>
          <p>Built module by module, tested end to end — not a prototype.</p>
        </motion.div>

        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              whileHover={{ y: -6 }}
            >
              <GlowCard className="feature-card">
                <div className="feature-icon">
                  <f.icon size={22} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="landing-section" id="workflow">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <span className="section-eyebrow">Workflow</span>
          <h2>From question bank to result — in four steps</h2>
        </motion.div>

        <div className="workflow-timeline">
          {workflow.map((w, i) => (
            <motion.div
              className="workflow-step"
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
            >
              <div className="workflow-step-num">{w.step}</div>
              <h4>{w.title}</h4>
              <p>{w.desc}</p>
            </motion.div>
          ))}
          <div className="workflow-line" />
        </div>
      </section>

      {/* DASHBOARD TABS */}
      <section className="landing-section" id="dashboards">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <span className="section-eyebrow">Built for every role</span>
          <h2>One platform, three tailored experiences</h2>
        </motion.div>

        <div className="dash-tabs">
          {Object.entries(tabContent).map(([key, val]) => (
            <button
              key={key}
              className={`dash-tab-btn ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <val.icon size={16} /> {val.title.split(" ")[0]}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="dash-preview-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3>{tabContent[activeTab].title}</h3>
            <ul>
              {tabContent[activeTab].points.map((p, i) => (
                <li key={i}>
                  <Check size={16} /> {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* TECH STACK */}
      <section className="landing-section" id="stack">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <span className="section-eyebrow">Under the hood</span>
          <h2>Powered by the MERN stack</h2>
        </motion.div>
        <div className="stack-row">
          {stack.map((s, i) => (
            <motion.div
              className="stack-pill"
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              whileHover={{ scale: 1.06 }}
            >
              {s}
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="landing-section why-section">
        <motion.div
          className="section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <span className="section-eyebrow">Why ExamSphere</span>
          <h2>Not a toy project — a real system</h2>
        </motion.div>
        <div className="why-grid">
          {[
            {
              icon: Lock,
              title: "Security first",
              desc: "JWT auth, bcrypt hashing, role-based access, server-side validation everywhere.",
            },
            {
              icon: TrendingUp,
              title: "Actually scalable",
              desc: "MongoDB Atlas, clean REST APIs, and a modular codebase built to extend.",
            },
            {
              icon: Sparkles,
              title: "Genuinely polished",
              desc: "From skeleton loaders to glassmorphism — every screen was designed, not defaulted.",
            },
          ].map((w, i) => (
            <motion.div
              className="why-item"
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
            >
              <div className="why-icon">
                <w.icon size={20} />
              </div>
              <h4>{w.title}</h4>
              <p>{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="landing-section">
        <motion.div
          className="cta-banner"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <div className="cta-glow" />
          <h2>Ready to see it in action?</h2>
          <p>Create an account and explore the full platform in minutes.</p>
          <button
            className="btn-shimmer btn-lg"
            onClick={() => navigate("/register")}
          >
            Get Started Free <ArrowRight size={17} />
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="landing-brand">
            <img
              src="/logo.png"
              alt="ExamSphere Logo"
              className="landing-logo"
            />

            <div className="brand-info">
              <span className="landing-brand-text">ExamSphere</span>
              {/* <span className="landing-brand-subtitle">
                Smart Online Examination Platform
              </span> */}
            </div>
          </div>
          <div className="footer-socials">
            <a href="#">
              <Code2 size={17} />
            </a>
            <a href="#">
              <FaXTwitter size={17} />
            </a>

            <a href="#">
              <FaLinkedin size={17} />
            </a>
          </div>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} ExamSphere — Smart Online Examination &
          Assessment System.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

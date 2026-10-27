import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  Search,
  ShoppingBag,
  Menu,
  X,
  Wrench,
  Drill,
  Droplets,
  Zap,
  DoorOpen,
  House,
  Settings,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Check,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { categories, products, brands } from "./data.js";
import { supabase } from "./lib/supabase.js";

const icons = {
  hardware: Settings,
  "power-tools": Drill,
  plumbing: Droplets,
  electrical: Zap,
  "furniture-fittings": DoorOpen,
  "home-essentials": House,
};
const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function App() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState({});
  const [saved, setSaved] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestEmail, setInterestEmail] = useState("");
  const [interestPhone, setInterestPhone] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [interestStatus, setInterestStatus] = useState("");
  const [interestLoading, setInterestLoading] = useState(false);
  const [bagMessage, setBagMessage] = useState("");

  useEffect(() => {
    const openInterest = () => {
      setInterestStatus("");
      setInterestOpen(true);
    };
    window.addEventListener("fixdora:open-interest", openInterest);
    return () =>
      window.removeEventListener("fixdora:open-interest", openInterest);
  }, []);

  const submitInterest = async (event) => {
    event.preventDefault();
    setInterestStatus("");

    const email = interestEmail.trim();
    const phone = interestPhone.trim();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneDigits = phone.replace(/\D/g, "");
    const phoneValid = phoneDigits.length >= 7 && phoneDigits.length <= 15;

    if (!email && !phone) {
      setInterestStatus("Please enter an email address or phone number.");
      return;
    }

    if (email && !emailValid) {
      setInterestStatus("Please enter a valid email address.");
      return;
    }

    if (phone && !phoneValid) {
      setInterestStatus("Please enter a valid phone number.");
      return;
    }

    if (!contactConsent) {
      setInterestStatus("Please agree to be contacted before submitting.");
      return;
    }
    if (!supabase) {
      setInterestStatus(
        "Supabase is not configured. Check your .env.local values and restart the dev server.",
      );
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const source =
      params.get("utm_source") ||
      (document.referrer ? new URL(document.referrer).hostname : "direct");
    const campaign = params.get("utm_campaign") || null;

    setInterestLoading(true);
    try {
      const { error } = await supabase
        .from("fixdora_interest_submissions")
        .insert([
          {
            email: emailValid ? email : null,
            phone: phoneValid ? phone : null,
            source: source.slice(0, 100),
            campaign: campaign ? campaign.slice(0, 200) : null,
            consent_to_contact: true,
          },
        ]);

      if (error) throw error;

      setInterestStatus("Thank you! Your interest has been registered.");
      setInterestEmail("");
      setInterestPhone("");
      setContactConsent(false);
    } catch (error) {
      console.error("Fixdora interest submission failed:", error);
      setInterestStatus(
        error?.message?.includes("row-level security")
          ? "Submission blocked by database security rules. Please check the Supabase insert policy."
          : "We couldn't submit your interest right now. Please try again.",
      );
    } finally {
      setInterestLoading(false);
    }
  };
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          activeCategory === "all" || product.category === activeCategory;
        const text =
          `${product.name} ${product.categoryName} ${product.description}`.toLowerCase();
        return matchesCategory && text.includes(query.trim().toLowerCase());
      }),
    [activeCategory, query],
  );
  const cartCount = Object.values(cart).reduce((total, qty) => total + qty, 0);
  const cartProducts = products.filter((p) => cart[p.id]);
  const cartTotal = cartProducts.reduce(
    (total, p) => total + p.price * cart[p.id],
    0,
  );

  const chooseCategory = (id) => {
    setActiveCategory(id);
    setMobileNav(false);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };
  const addToCart = (product) => {
    setCart((old) => ({
      ...old,
      [product.id]: (old[product.id] || 0) + 1,
    }));
    setBagMessage(`${product.name} added to your demo bag.`);
    window.clearTimeout(window.__fixdoraBagMessageTimer);
    window.__fixdoraBagMessageTimer = window.setTimeout(() => {
      setBagMessage("");
    }, 3200);
  };

  return (
    <div className="app-shell">
      {bagMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 1100,
            maxWidth: "min(360px, calc(100vw - 40px))",
            padding: "14px 18px",
            borderRadius: 12,
            background: "#171717",
            color: "#fff",
            borderLeft: "5px solid #ffd52a",
            boxShadow: "0 12px 36px rgba(0,0,0,.24)",
            fontSize: 14,
            lineHeight: 1.45,
          }}
        >
          <strong style={{ display: "block", marginBottom: 3 }}>
            Added to bag
          </strong>
          {bagMessage}
          <div style={{ display: "flex", gap: 12, marginTop: 9 }}>
            <button
              type="button"
              onClick={() => {
                setCartOpen(true);
                setBagMessage("");
              }}
              style={{
                border: 0,
                padding: 0,
                background: "transparent",
                color: "#ffd52a",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View demo bag
            </button>
            <button
              type="button"
              onClick={() => setBagMessage("")}
              style={{
                border: 0,
                padding: 0,
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="prototype-bar">
        <span className="live-dot" /> FIXdora MARKET-RESEARCH PROTOTYPE{" "}
        <span>No real orders or payments</span>
      </div>
      <header className="header">
        <a className="logo" href="#" aria-label="Fixdora home">
          fix<span>dora</span>
          <i>.</i>
        </a>
        <button
          className="mobile-menu icon-btn"
          onClick={() => setMobileNav(!mobileNav)}
          aria-label="Toggle categories"
        >
          <Menu />
        </button>
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hardware, tools, fittings..."
            aria-label="Search products"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <div className="header-tools">
          <button
            className="launch-link"
            onClick={() =>
              document
                .getElementById("interest")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Launch updates <ArrowUpRight size={15} />
          </button>
          <button
            className="icon-btn"
            onClick={() =>
              document
                .getElementById("products")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            aria-label="View saved products"
          >
            <Heart />
            <span className="counter">{saved.length}</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Open demo bag"
          >
            <ShoppingBag />
            <span className="counter">{cartCount}</span>
          </button>
        </div>
      </header>

      <nav className={`category-nav ${mobileNav ? "nav-open" : ""}`}>
        {categories.map((category) => {
          const Icon = icons[category.id] || Settings;
          return (
            <button
              key={category.id}
              className={
                activeCategory === category.id
                  ? "category-nav-item active"
                  : "category-nav-item"
              }
              onClick={() => chooseCategory(category.id)}
            >
              <Icon size={16} />
              {category.name}
            </button>
          );
        })}
      </nav>

      <main>
        <section className="hero container">
          <div className="hero-content">
            <span className="eyebrow">
              <Sparkles size={14} /> THE EVERYDAY FIX EDIT
            </span>
            <h1>
              Fix your space.
              <br />
              <em>Upgrade your</em> everyday.
            </h1>
            <p>
              Hardware, tools and home-improvement essentials for the things you
              want to build, repair and make better.
            </p>
            <div className="hero-buttons">
              <button
                className="btn btn-yellow"
                onClick={() =>
                  document
                    .getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore products <ArrowRight size={17} />
              </button>
              <button
                className="plain-link"
                onClick={() =>
                  document
                    .getElementById("interest")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get launch updates <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="hero-proof">
              <span>
                <ShieldCheck size={17} /> Practical essentials
              </span>
              <span>
                <Check size={17} /> Prototype preview
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <span className="hero-index">FIXdora / EDIT 001</span>
            <div className="hero-ring ring-a" />
            <div className="hero-ring ring-b" />
            <div className="hero-block block-a">
              <Wrench size={82} />
            </div>
            <div className="hero-block block-b">
              <Drill size={115} />
            </div>
            <div className="hero-block block-c">
              <Settings size={60} />
            </div>
            <span className="hero-caption">TOOLS FOR EVERYDAY WINS</span>
          </div>
        </section>

        <section className="promo-row container">
          <article className="promo-card promo-dark">
            <div>
              <span className="eyebrow">01 / FIXdora PICKS</span>
              <h2>
                Small upgrades.
                <br />
                Big difference.
              </h2>
              <p>Useful details for your next home project.</p>
              <button onClick={() => chooseCategory("hardware")}>
                Explore hardware <ArrowRight size={15} />
              </button>
            </div>
            <span className="promo-number">FX/01</span>
          </article>
          <article className="promo-card promo-light">
            <div>
              <span className="eyebrow">02 / TOOL TIME</span>
              <h2>
                Ready for your
                <br />
                next fix?
              </h2>
              <p>Find practical tools for everyday jobs.</p>
              <button onClick={() => chooseCategory("power-tools")}>
                Browse tools <ArrowRight size={15} />
              </button>
            </div>
            <span className="promo-number">FX/02</span>
          </article>
        </section>

        <section className="container category-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">FIND YOUR FIX</span>
              <h2>
                Shop by category<span>.</span>
              </h2>
            </div>
            <button
              className="plain-link"
              onClick={() => chooseCategory("all")}
            >
              View all <ArrowRight size={16} />
            </button>
          </div>
          <div className="category-grid">
            {categories
              .filter((c) => c.id !== "all")
              .map((category, i) => {
                const Icon = icons[category.id] || Settings;
                return (
                  <button
                    key={category.id}
                    className={`category-card category-${i + 1}`}
                    onClick={() => chooseCategory(category.id)}
                  >
                    <span className="category-art">
                      <Icon size={34} />
                      <i>0{i + 1}</i>
                    </span>
                    <strong>{category.name}</strong>
                    <ArrowUpRight className="category-arrow" size={17} />
                  </button>
                );
              })}
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="container">
            <div className="section-head product-head">
              <div>
                <span className="eyebrow">GOOD GEAR. GOOD VALUE.</span>
                <h2>
                  {activeCategory === "all"
                    ? "Popular right now"
                    : categories.find((c) => c.id === activeCategory)?.name}
                  <span>.</span>
                </h2>
                <p className="subhead">
                  Illustrative products and prices for market research only.
                </p>
              </div>
              <div className="result-count">
                {filteredProducts.length} products{" "}
                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setQuery("");
                  }}
                >
                  Reset filters
                </button>
              </div>
            </div>
            {filteredProducts.length ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.classList.add(
                            "fallback-image",
                          );
                        }}
                      />
                      {product.badge && (
                        <span className="product-badge">{product.badge}</span>
                      )}
                      <button
                        className={`save-btn ${saved.includes(product.id) ? "saved" : ""}`}
                        onClick={() =>
                          setSaved((old) =>
                            old.includes(product.id)
                              ? old.filter((id) => id !== product.id)
                              : [...old, product.id],
                          )
                        }
                        aria-label={
                          saved.includes(product.id)
                            ? "Remove from saved"
                            : "Save product"
                        }
                      >
                        <Heart
                          size={17}
                          fill={
                            saved.includes(product.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                      <span className="product-id">{product.id}</span>
                    </div>
                    <div className="product-details">
                      <span className="product-category">
                        {product.categoryName}
                      </span>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="price-row">
                        <strong>{money(product.price)}</strong>
                        <del>{money(product.oldPrice)}</del>
                        <span>
                          {Math.round(
                            (1 - product.price / product.oldPrice) * 100,
                          )}
                          % off*
                        </span>
                      </div>
                      <button
                        className="add-btn"
                        onClick={() => addToCart(product)}
                      >
                        <Plus size={16} /> Add to bag <small>DEMO</small>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <Search size={30} />
                <h3>No products found</h3>
                <p>Try a different search or category.</p>
                <button
                  className="btn btn-yellow"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
            <p className="disclaimer">
              *Illustrative prices and discounts only. Stock and offers are not
              live. Adding to bag does not place an order.
            </p>
          </div>
        </section>

        <section className="container brands-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">BRANDS YOU MAY KNOW</span>
              <h2>
                Made for the work<span>.</span>
              </h2>
            </div>
            <span className="subhead">Illustrative brand strip</span>
          </div>
          <div className="brand-grid">
            {brands.map((brand, i) => (
              <div className={`brand-card brand-${i + 1}`} key={brand}>
                <strong>{brand}</strong>
                <small>TOOLS / HOME</small>
              </div>
            ))}
          </div>
        </section>

        <section className="container interest-banner" id="interest">
          <div className="interest-copy">
            <span className="eyebrow">YOUR NEXT PROJECT STARTS HERE</span>
            <h2>
              Fix it. Fit it.
              <br />
              <em>Love it.</em>
            </h2>
            <p>
              Help shape a better way to shop for everyday hardware and
              home-improvement essentials.
            </p>
            <button
              className="btn btn-yellow"
              onClick={() =>
                window.dispatchEvent(new Event("fixdora:open-interest"))
              }
            >
              Register your interest <ArrowRight size={17} />
            </button>
          </div>
          <div className="interest-art">
            <div className="interest-orbit" />
            <Wrench size={95} />
            <Drill size={105} />
            <span>BUILT FOR EVERYDAY FIXES</span>
          </div>
        </section>

        <section className="trust-strip">
          <div className="container trust-grid">
            <div>
              <ShieldCheck />
              <span>
                <strong>Research-first</strong>
                <small>Helping us understand what people need.</small>
              </span>
            </div>
            <div>
              <Check />
              <span>
                <strong>Clear and transparent</strong>
                <small>No real checkout or payment processing.</small>
              </span>
            </div>
            <div>
              <MessageCircle />
              <span>
                <strong>Your feedback matters</strong>
                <small>Register interest in a possible future launch.</small>
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-main">
          <div>
            <a className="logo footer-logo" href="#">
              fix<span>dora</span>
              <i>.</i>
            </a>
            <p>Everyday hardware. Better home projects.</p>
            <strong className="footer-tag">FIX IT. FIT IT. LOVE IT.</strong>
            <div className="social-links">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <h3>Explore</h3>
            <button onClick={() => chooseCategory("all")}>All products</button>
            <button onClick={() => chooseCategory("hardware")}>Hardware</button>
            <button onClick={() => chooseCategory("power-tools")}>
              Power tools
            </button>
            <button onClick={() => chooseCategory("furniture-fittings")}>
              Furniture fittings
            </button>
          </div>
          <div className="footer-links">
            <h3>Fixdora</h3>
            <button
              onClick={() =>
                document
                  .getElementById("interest")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Launch updates
            </button>
            <a href="/privacy.html">Privacy notice</a>
            <a href="/prototype-details.html">Prototype details</a>
          </div>
          <div className="footer-note" id="prototype">
            <span className="eyebrow">PLEASE NOTE</span>
            <p>
              Fixdora is a market-research prototype. Product information,
              prices, discounts and availability are illustrative. No real
              orders or payments are accepted.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <span>
              © {new Date().getFullYear()} Fixdora · Prototype concept
            </span>
            <span>FIX IT. FIT IT. LOVE IT.</span>
          </div>
        </div>
      </footer>

      {interestOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInterestOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,.68)",
            display: "grid",
            placeItems: "center",
            padding: 18,
            overflowY: "auto",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="interest-modal-title"
            style={{
              width: "min(100%, 480px)",
              background: "#fff",
              color: "#171717",
              borderRadius: 18,
              padding: 26,
              boxShadow: "0 24px 80px rgba(0,0,0,.25)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setInterestOpen(false)}
              aria-label="Close interest form"
              style={{
                position: "absolute",
                right: 14,
                top: 14,
                border: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <X size={22} />
            </button>
            <p style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 700 }}>
              FIXdora / LAUNCH UPDATES
            </p>
            <h2 id="interest-modal-title" style={{ margin: "8px 0" }}>
              Help shape what comes next.
            </h2>
            <p style={{ color: "#555", lineHeight: 1.5 }}>
              Register your interest in this market-research prototype. No
              orders or payments are taken.
            </p>
            <form
              onSubmit={submitInterest}
              style={{ display: "grid", gap: 14, marginTop: 20 }}
            >
              <label
                style={{
                  display: "grid",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Email address (optional if you provide a phone)
                <input
                  type="email"
                  autoComplete="email"
                  value={interestEmail}
                  onChange={(e) => setInterestEmail(e.target.value)}
                  maxLength={254}
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: 12,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <label
                style={{
                  display: "grid",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Phone number (optional if you provide an email)
                <input
                  type="tel"
                  autoComplete="tel"
                  value={interestPhone}
                  onChange={(e) => setInterestPhone(e.target.value)}
                  maxLength={30}
                  placeholder="Your phone number"
                  style={{
                    width: "100%",
                    padding: 12,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 9,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(e) => setContactConsent(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  I agree that Fixdora may contact me about launch updates and
                  market research. I can withdraw my consent later.
                </span>
              </label>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                See our{" "}
                <a href="/privacy.html" target="_blank" rel="noreferrer">
                  privacy notice
                </a>{" "}
                for details.
              </p>
              {interestStatus && (
                <p
                  role="status"
                  aria-live="polite"
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: interestStatus.startsWith("Thanks!")
                      ? "#176b37"
                      : "#a12622",
                  }}
                >
                  {interestStatus}
                </p>
              )}
              <button
                type="submit"
                disabled={interestLoading}
                style={{
                  border: 0,
                  borderRadius: 9,
                  padding: "13px 16px",
                  background: "#ffd52a",
                  color: "#171717",
                  fontWeight: 800,
                  cursor: interestLoading ? "wait" : "pointer",
                  opacity: interestLoading ? 0.7 : 1,
                }}
              >
                {interestLoading ? "Submitting..." : "Register my interest"}
              </button>
            </form>
          </section>
        </div>
      )}

      {cartOpen && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCartOpen(false);
          }}
        >
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Demo shopping bag"
          >
            <div className="drawer-head">
              <div>
                <span className="eyebrow">DEMO BAG</span>
                <h2>Your bag ({cartCount})</h2>
              </div>
              <button
                className="icon-btn"
                onClick={() => setCartOpen(false)}
                aria-label="Close bag"
              >
                <X />
              </button>
            </div>
            {cartProducts.length ? (
              <>
                <div className="cart-items">
                  {cartProducts.map((p) => (
                    <div className="cart-item" key={p.id}>
                      <img src={p.image} alt="" />
                      <div className="cart-item-copy">
                        <strong>{p.name}</strong>
                        <b>{money(p.price)}</b>
                        <div className="qty">
                          <button
                            onClick={() =>
                              setCart((old) => ({
                                ...old,
                                [p.id]: Math.max(0, (old[p.id] || 0) - 1),
                              }))
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span>{cart[p.id]}</span>
                          <button
                            onClick={() =>
                              setCart((old) => ({
                                ...old,
                                [p.id]: (old[p.id] || 0) + 1,
                              }))
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() =>
                          setCart((old) => {
                            const next = { ...old };
                            delete next[p.id];
                            return next;
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <span>Illustrative subtotal</span>
                  <strong>{money(cartTotal)}</strong>
                </div>
                <p className="cart-notice">
                  Demo only. Checkout, orders and payments are disabled.
                </p>
                <button
                  className="btn btn-yellow full-btn"
                  onClick={() => {
                    setCartOpen(false);
                    document
                      .getElementById("interest")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Register interest instead <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <div className="empty-cart">
                <ShoppingBag size={34} />
                <h3>Your bag is empty</h3>
                <p>Add a product to explore the demo bag.</p>
                <button
                  className="btn btn-yellow"
                  onClick={() => setCartOpen(false)}
                >
                  Continue browsing
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

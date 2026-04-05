import { useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">

      {/* NAV */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <h1 className="text-sm font-semibold tracking-wide text-white/90">
          FieldSync
        </h1>

        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Sign in
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative">

        {/* glow */}
        <div className="absolute inset-0 flex justify-center pointer-events-none animate-pulse">
          <div className="w-[600px] h-[600px] bg-indigo-600/20 blur-[140px] rounded-full" />
        </div>

        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.1]">
          The operating system
          <br />
          <span className="text-white/40">for your workforce</span>
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          Track shifts, manage teams, and run your operations in real time —
          without spreadsheets, guesswork, or chaos.
        </p>

        <div className="mt-10 flex justify-center gap-4">

          <button
            onClick={() => navigate('/signup')}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl text-sm font-medium transition hover:scale-105"
          >
            Start Free
          </button>

          <button
            onClick={() => navigate('/login')}
            className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl text-sm transition hover:scale-105"
          >
            Sign In
          </button>

        </div>

      </div>

      {/* TRUST / STATS */}
      <div className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">

          <div>
            <p className="text-2xl font-semibold">12,000+</p>
            <p className="text-gray-500 text-xs mt-1">Shifts tracked</p>
          </div>

          <div>
            <p className="text-2xl font-semibold">800+</p>
            <p className="text-gray-500 text-xs mt-1">Active users</p>
          </div>

          <div>
            <p className="text-2xl font-semibold">5,000+</p>
            <p className="text-gray-500 text-xs mt-1">Tasks completed</p>
          </div>

          <div>
            <p className="text-2xl font-semibold">99.9%</p>
            <p className="text-gray-500 text-xs mt-1">System uptime</p>
          </div>

        </div>
      </div>

      {/* PRODUCT PREVIEW */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 backdrop-blur hover:border-white/10 transition">

          <div className="grid md:grid-cols-3 gap-4 mb-6">

            <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition">
              <p className="text-xs text-gray-400">Active Workers</p>
              <p className="text-lg mt-2">14</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition">
              <p className="text-xs text-gray-400">Tasks Today</p>
              <p className="text-lg mt-2">32</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition">
              <p className="text-xs text-gray-400">Locations</p>
              <p className="text-lg mt-2">6</p>
            </div>

          </div>

          <div className="h-40 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-xl animate-pulse" />
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-8">

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition">
          <h3 className="text-lg font-medium mb-2">Real-time tracking</h3>
          <p className="text-gray-400 text-sm">
            Know exactly where your team is and what they’re doing instantly.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition">
          <h3 className="text-lg font-medium mb-2">Task management</h3>
          <p className="text-gray-400 text-sm">
            Assign and track work with full visibility across your workforce.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:bg-white/[0.04] transition">
          <h3 className="text-lg font-medium mb-2">Location control</h3>
          <p className="text-gray-400 text-sm">
            Ensure employees are exactly where they should be at all times.
          </p>
        </div>

      </div>

      {/* PRICING */}
      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">

          <h2 className="text-3xl font-semibold mb-4">
            Simple, scalable pricing
          </h2>

          <p className="text-gray-400 mb-12">
            £6 per employee per month. No hidden fees.
          </p>

          <div className="grid md:grid-cols-2 gap-8">

            {/* FREE */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8">
              <h3 className="text-xl font-medium mb-2">Starter</h3>

              <p className="text-3xl font-semibold mb-6">
                Free
              </p>

              <ul className="text-sm text-gray-400 space-y-2 mb-6">
                <li>✔ Up to 3 employees</li>
                <li>✔ Shift tracking</li>
                <li>✔ Basic tasks</li>
              </ul>

              <button
                onClick={() => navigate('/signup')}
                className="btn-secondary w-full"
              >
                Get Started
              </button>
            </div>

            {/* PRO */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-8 relative">

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-indigo-600 px-3 py-1 rounded-full">
                Most popular
              </div>

              <h3 className="text-xl font-medium mb-2">Pro</h3>

              <p className="text-3xl font-semibold mb-2">
                £6
                <span className="text-sm text-gray-400"> / employee / month</span>
              </p>

              <ul className="text-sm text-gray-400 space-y-2 mb-6">
                <li>✔ Unlimited employees</li>
                <li>✔ Analytics dashboard</li>
                <li>✔ Multiple locations</li>
                <li>✔ Real-time tracking</li>
              </ul>

              <button
                onClick={() => navigate('/signup')}
                className="bg-indigo-600 hover:bg-indigo-500 w-full py-3 rounded-xl transition hover:scale-105"
              >
                Start Free Trial
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">

        <h2 className="text-3xl font-semibold">
          Take control of your workforce
        </h2>

        <p className="text-gray-400 mt-4">
          Everything you need to manage your team — in one place.
        </p>

        <button
          onClick={() => navigate('/signup')}
          className="mt-8 bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-xl font-medium transition hover:scale-105"
        >
          Get Started Free
        </button>

      </div>

    </div>
  );
}

export default Landing;
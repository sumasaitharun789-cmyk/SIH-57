export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <h1 className="text-2xl font-bold">
          Marine<span className="text-cyan-400">Guard</span>
        </h1>

        <div className="flex gap-8 text-sm text-slate-300">
          <a href="#home" className="hover:text-cyan-400">
            Home
          </a>
          <a href="#technology" className="hover:text-cyan-400">
            Technology
          </a>
          <a href="#detection" className="hover:text-cyan-400">
            Detection
          </a>
          <a href="#about" className="hover:text-cyan-400">
            About
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="flex min-h-[85vh] flex-col items-center justify-center px-6 text-center"
      >
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Smart India Hackathon 2026
        </p>

        <h2 className="max-w-5xl text-5xl font-bold leading-tight md:text-7xl">
          AI-Powered Underwater
          <span className="block text-cyan-400">
            Marine Debris Detection
          </span>
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
          An intelligent system for detecting marine debris and underwater
          anomalies using Side-Scan Sonar imagery and advanced AI-based
          image analysis.
        </p>

        <div className="mt-10 flex gap-4">
          <a
            href="#detection"
            className="rounded-lg bg-cyan-500 px-7 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Explore Detection
          </a>

          <a
            href="#technology"
            className="rounded-lg border border-slate-700 px-7 py-3 font-semibold hover:border-cyan-400"
          >
            View Technology
          </a>
        </div>
      </section>

      {/* Problem Section */}
      <section
        id="technology"
        className="border-t border-slate-800 px-8 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            The Challenge
          </p>

          <h3 className="mt-3 text-4xl font-bold">
            Protecting our underwater environment
          </h3>

          <p className="mt-5 max-w-3xl text-slate-400 leading-7">
            Marine debris such as ghost nets, discarded objects and other
            underwater anomalies are difficult to identify using traditional
            inspection methods. Large volumes of sonar imagery require
            intelligent automated analysis.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h4 className="text-xl font-bold">Ghost Nets</h4>
              <p className="mt-3 text-slate-400">
                Abandoned fishing gear can remain underwater and threaten
                marine ecosystems.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h4 className="text-xl font-bold">Manual Inspection</h4>
              <p className="mt-3 text-slate-400">
                Analysing large amounts of Side-Scan Sonar imagery manually
                is time-consuming.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h4 className="text-xl font-bold">False Positives</h4>
              <p className="mt-3 text-slate-400">
                Natural seabed structures can sometimes resemble underwater
                objects and debris.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detection Section */}
      <section
        id="detection"
        className="bg-slate-900 px-8 py-20"
      >
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            AI Detection Pipeline
          </p>

          <h3 className="mt-3 text-4xl font-bold">
            From sonar image to intelligent detection
          </h3>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-slate-950 p-6">
              <div className="text-3xl font-bold text-cyan-400">01</div>
              <h4 className="mt-4 font-bold">Sonar Input</h4>
              <p className="mt-2 text-sm text-slate-400">
                Side-Scan Sonar imagery is provided to the system.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-6">
              <div className="text-3xl font-bold text-cyan-400">02</div>
              <h4 className="mt-4 font-bold">AI Analysis</h4>
              <p className="mt-2 text-sm text-slate-400">
                AI models analyse the sonar image for possible objects.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-6">
              <div className="text-3xl font-bold text-cyan-400">03</div>
              <h4 className="mt-4 font-bold">Filtering</h4>
              <p className="mt-2 text-sm text-slate-400">
                Shadow and geometry information helps reduce false positives.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-6">
              <div className="text-3xl font-bold text-cyan-400">04</div>
              <h4 className="mt-4 font-bold">Visualization</h4>
              <p className="mt-2 text-sm text-slate-400">
                Detected anomalies can be presented through an interactive
                interface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-8 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            SIH-57
          </p>

          <h3 className="mt-3 text-4xl font-bold">
            Intelligent monitoring beneath the surface
          </h3>

          <p className="mt-6 leading-8 text-slate-400">
            Our proposed system combines Side-Scan Sonar imagery,
            AI-powered detection and intelligent false-positive filtering
            to support faster identification of marine debris and underwater
            anomalies.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-8 text-center text-sm text-slate-500">
        SIH-57 • AI-Powered Automated Underwater Marine Debris and Anomaly Detection System
      </footer>
    </main>
  );
}
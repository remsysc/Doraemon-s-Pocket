import "../../css/cityscape.css";

/**
 * AnimatedCityscape — Decorative nighttime cityscape with animated windows.
 * Pure static JSX. No React hooks. All animation is CSS-only.
 * aria-hidden="true" ensures screen readers skip this decorative content.
 */
export default function AnimatedCityscape() {
    return (
        <div className="cityscape" aria-hidden="true">
            {/* Horizon glow gradient */}
            <div className="cityscape__horizon-glow" />

            {/* Building layers — far (darkest) */}
            <div className="cityscape__buildings cityscape__buildings--far">
                <div className="cityscape__building" style={{ height: "35%" }} />
                <div className="cityscape__building" style={{ height: "50%" }} />
                <div className="cityscape__building" style={{ height: "40%" }} />
                <div className="cityscape__building" style={{ height: "60%" }} />
                <div className="cityscape__building" style={{ height: "45%" }} />
                <div className="cityscape__building" style={{ height: "55%" }} />
                <div className="cityscape__building" style={{ height: "38%" }} />
                <div className="cityscape__building" style={{ height: "52%" }} />
                <div className="cityscape__building" style={{ height: "42%" }} />
                <div className="cityscape__building" style={{ height: "48%" }} />
                <div className="cityscape__building" style={{ height: "56%" }} />
                <div className="cityscape__building" style={{ height: "44%" }} />
            </div>

            {/* Building layers — mid */}
            <div className="cityscape__buildings cityscape__buildings--mid">
                <div className="cityscape__building" style={{ height: "45%" }} />
                <div className="cityscape__building" style={{ height: "65%" }} />
                <div className="cityscape__building" style={{ height: "55%" }} />
                <div className="cityscape__building" style={{ height: "75%" }} />
                <div className="cityscape__building" style={{ height: "50%" }} />
                <div className="cityscape__building" style={{ height: "70%" }} />
                <div className="cityscape__building" style={{ height: "60%" }} />
                <div className="cityscape__building" style={{ height: "80%" }} />
                <div className="cityscape__building" style={{ height: "48%" }} />
                <div className="cityscape__building" style={{ height: "62%" }} />
            </div>

            {/* Building layers — near (lightest) with windows */}
            <div className="cityscape__buildings cityscape__buildings--near">
                <div className="cityscape__building" style={{ height: "55%" }} />
                <div className="cityscape__building" style={{ height: "80%" }} />
                <div className="cityscape__building" style={{ height: "65%" }} />
                <div className="cityscape__building" style={{ height: "90%" }} />
                <div className="cityscape__building" style={{ height: "58%" }} />
                <div className="cityscape__building" style={{ height: "85%" }} />
                <div className="cityscape__building" style={{ height: "72%" }} />
                <div className="cityscape__building" style={{ height: "95%" }} />
                <div className="cityscape__building" style={{ height: "62%" }} />
                <div className="cityscape__building" style={{ height: "78%" }} />

                {/* Windows — 36 total, positioned across the near layer */}
                <span className="cityscape__window" style={{ left: "5%", bottom: "12%" }} />
                <span className="cityscape__window" style={{ left: "8%", bottom: "18%" }} />
                <span className="cityscape__window" style={{ left: "12%", bottom: "10%" }} />
                <span className="cityscape__window" style={{ left: "15%", bottom: "22%" }} />
                <span className="cityscape__window" style={{ left: "18%", bottom: "30%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "22%", bottom: "15%" }} />
                <span className="cityscape__window" style={{ left: "25%", bottom: "25%" }} />
                <span className="cityscape__window" style={{ left: "28%", bottom: "35%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "32%", bottom: "20%" }} />
                <span className="cityscape__window" style={{ left: "35%", bottom: "40%" }} />
                <span className="cityscape__window" style={{ left: "38%", bottom: "28%" }} />
                <span className="cityscape__window" style={{ left: "40%", bottom: "45%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "43%", bottom: "15%" }} />
                <span className="cityscape__window" style={{ left: "46%", bottom: "32%" }} />
                <span className="cityscape__window" style={{ left: "48%", bottom: "50%" }} />
                <span className="cityscape__window" style={{ left: "51%", bottom: "22%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "54%", bottom: "38%" }} />
                <span className="cityscape__window" style={{ left: "56%", bottom: "55%" }} />
                <span className="cityscape__window" style={{ left: "58%", bottom: "18%" }} />
                <span className="cityscape__window" style={{ left: "61%", bottom: "42%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "63%", bottom: "28%" }} />
                <span className="cityscape__window" style={{ left: "65%", bottom: "48%" }} />
                <span className="cityscape__window" style={{ left: "67%", bottom: "12%" }} />
                <span className="cityscape__window" style={{ left: "70%", bottom: "35%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "72%", bottom: "52%" }} />
                <span className="cityscape__window" style={{ left: "74%", bottom: "20%" }} />
                <span className="cityscape__window" style={{ left: "76%", bottom: "40%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "78%", bottom: "58%" }} />
                <span className="cityscape__window" style={{ left: "80%", bottom: "25%" }} />
                <span className="cityscape__window" style={{ left: "82%", bottom: "45%" }} />
                <span className="cityscape__window" style={{ left: "84%", bottom: "15%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "86%", bottom: "32%" }} />
                <span className="cityscape__window" style={{ left: "88%", bottom: "50%" }} />
                <span className="cityscape__window" style={{ left: "90%", bottom: "22%" }} />
                <span className="cityscape__window cityscape__window--dim" style={{ left: "92%", bottom: "38%" }} />
                <span className="cityscape__window" style={{ left: "95%", bottom: "28%" }} />
            </div>

            {/* Transmission tower with aviation warning light */}
            <svg
                className="cityscape__tower"
                viewBox="0 0 60 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Tower structure */}
                <path
                    d="M28 300 L24 40 L30 0 L36 40 L32 300 Z"
                    fill="var(--wb-tower-color)"
                />
                {/* Cross beams */}
                <path
                    d="M20 260 L40 260 M18 220 L42 220 M16 180 L44 180 M14 140 L46 140 M12 100 L48 100 M16 60 L44 60"
                    stroke="var(--wb-tower-color)"
                    strokeWidth="1.5"
                />
                {/* Diagonal braces */}
                <path
                    d="M24 260 L36 220 M36 260 L24 220 M24 220 L36 180 M36 220 L24 180 M24 180 L36 140 M36 180 L24 140 M24 140 L36 100 M36 140 L24 100"
                    stroke="var(--wb-tower-color)"
                    strokeWidth="0.8"
                    opacity="0.7"
                />
                {/* Power line arms */}
                <path
                    d="M5 100 L24 100 M36 100 L55 100 M8 140 L24 140 M36 140 L52 140"
                    stroke="var(--wb-tower-color)"
                    strokeWidth="2"
                />
                {/* Aviation warning light */}
                <circle
                    className="cityscape__aviation-light"
                    cx="30"
                    cy="4"
                    r="4"
                    fill="var(--wb-aviation-light)"
                />
            </svg>

            {/* Power lines */}
            <svg
                className="cityscape__power-lines"
                viewBox="0 0 800 40"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M0 20 Q200 28 400 18 Q600 8 800 22"
                    stroke="var(--wb-tower-color)"
                    strokeWidth="0.8"
                    opacity="0.5"
                />
                <path
                    d="M0 25 Q200 33 400 23 Q600 13 800 27"
                    stroke="var(--wb-tower-color)"
                    strokeWidth="0.6"
                    opacity="0.4"
                />
            </svg>

            {/* Waveform accent */}
            <svg
                className="cityscape__waveform"
                viewBox="0 0 400 30"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <polyline
                    points="0,15 20,12 40,18 60,8 80,22 100,10 120,20 140,5 160,25 180,12 200,18 220,7 240,23 260,11 280,19 300,6 320,24 340,13 360,17 380,9 400,15"
                    stroke="var(--wb-cyan-accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                />
            </svg>
        </div>
    );
}

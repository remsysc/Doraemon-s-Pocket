import "../../css/cityscape.css";

/**
 * AnimatedCityscape — Decorative nighttime scene with houses, radio tower, and animated windows.
 * Pure static JSX. No React hooks. All animation is CSS-only.
 * aria-hidden="true" ensures screen readers skip this decorative content.
 */
export default function AnimatedCityscape() {
    return (
        <div className="cityscape" aria-hidden="true">
            {/* Horizon glow gradient */}
            <div className="cityscape__horizon-glow" />

            {/* House layers — far (darkest) */}
            <div className="cityscape__houses cityscape__houses--far">
                <div className="cityscape__house cityscape__house--sm">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--md">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--lg">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--md">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--sm">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--lg">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
            </div>

            {/* House layers — mid */}
            <div className="cityscape__houses cityscape__houses--mid">
                <div className="cityscape__house cityscape__house--lg">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--sm">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--md">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--lg">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--md">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--sm">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
            </div>

            {/* House layers — near (lightest) */}
            <div className="cityscape__houses cityscape__houses--near">
                <div className="cityscape__house cityscape__house--md">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--lg">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--sm">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--lg">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--md">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--sm">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
                <div className="cityscape__house cityscape__house--lg">
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                    <div className="cityscape__house-windows">
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                        <span className="cityscape__window" />
                    </div>
                </div>
            </div>

            {/* Static radio tower */}
            <svg
                className="cityscape__tower"
                viewBox="0 0 80 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Main mast */}
                <path
                    d="M38 400 L36 30 L40 0 L44 30 L42 400 Z"
                    fill="var(--wb-tower-color)"
                />
                {/* Antenna at top */}
                <line x1="40" y1="0" x2="40" y2="-10" stroke="var(--wb-tower-color)" strokeWidth="1.5" />
                {/* Cross arms */}
                <line x1="30" y1="50" x2="50" y2="50" stroke="var(--wb-tower-color)" strokeWidth="1.5" />
                <line x1="28" y1="100" x2="52" y2="100" stroke="var(--wb-tower-color)" strokeWidth="1.5" />
                <line x1="25" y1="160" x2="55" y2="160" stroke="var(--wb-tower-color)" strokeWidth="1.5" />
                <line x1="22" y1="230" x2="58" y2="230" stroke="var(--wb-tower-color)" strokeWidth="1.5" />
                <line x1="20" y1="310" x2="60" y2="310" stroke="var(--wb-tower-color)" strokeWidth="1.5" />
                {/* Guy-wires (left) */}
                <line x1="40" y1="30" x2="5" y2="400" stroke="var(--wb-tower-color)" strokeWidth="0.7" opacity="0.5" />
                <line x1="40" y1="100" x2="10" y2="400" stroke="var(--wb-tower-color)" strokeWidth="0.6" opacity="0.4" />
                {/* Guy-wires (right) */}
                <line x1="40" y1="30" x2="75" y2="400" stroke="var(--wb-tower-color)" strokeWidth="0.7" opacity="0.5" />
                <line x1="40" y1="100" x2="70" y2="400" stroke="var(--wb-tower-color)" strokeWidth="0.6" opacity="0.4" />
                {/* Diagonal braces */}
                <path
                    d="M36 50 L44 100 M44 50 L36 100 M36 100 L44 160 M44 100 L36 160 M36 160 L44 230 M44 160 L36 230 M36 230 L44 310 M44 230 L36 310"
                    stroke="var(--wb-tower-color)"
                    strokeWidth="0.6"
                    opacity="0.5"
                />
                {/* Static red light at top — no animation */}
                <circle
                    className="cityscape__tower-light"
                    cx="40"
                    cy="8"
                    r="4"
                    fill="var(--wb-aviation-light)"
                />
                {/* Red glow effect */}
                <circle
                    cx="40"
                    cy="8"
                    r="8"
                    fill="var(--wb-aviation-light)"
                    opacity="0.3"
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

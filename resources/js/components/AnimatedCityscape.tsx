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

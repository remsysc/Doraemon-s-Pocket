interface PlaceholderCardProps {
    title: string;
    icon?: string;
}

export default function PlaceholderCard({ title, icon }: PlaceholderCardProps) {
    return (
        <div className="placeholder-card">
            {icon && <span className="placeholder-card__icon">{icon}</span>}
            <span className="placeholder-card__title">{title}</span>
            <span className="placeholder-card__badge">Coming soon</span>
        </div>
    );
}

export default function Dashboard() {
    const reports = [
        {
            id: 1,
            barangay: "Barangay Uno",
            status: "Resolved",
        },
        {
            id: 2,
            barangay: "Barangay Dos",
            status: "Pending",
        },
        {
            id: 3,
            barangay: "Barangay Tres",
            status: "Ongoing",
        },
    ];

    return (
        <div className="dashboard">
            <header className="topbar">
                <h2>⚡ WalangBrownout</h2>

                <span>Welcome, Admin</span>
            </header>

            <section className="cards">
                <div className="card">
                    <h3>Total Reports</h3>
                    <h1>28</h1>
                </div>

                <div className="card">
                    <h3>Resolved</h3>
                    <h1>23</h1>
                </div>

                <div className="card">
                    <h3>Pending</h3>
                    <h1>5</h1>
                </div>
            </section>

            <section className="reports">
                <h2>Recent Reports</h2>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Barangay</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.id}>
                                <td>{report.id}</td>
                                <td>{report.barangay}</td>
                                <td>{report.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

import { useParams, Link } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/Puter";
import Navbar from "~/components/Navbar";
import ScoreCircle from "~/components/scoreCircle";

export const meta = () => ([
    { title: 'Resume Analysis Results' },
    { name: 'description', content: 'View your resume analysis results and feedback' },
]);

const Resume = () => {
    const { id } = useParams();
    const { kv } = usePuterStore();
    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadResume = async () => {
            if (!id) {
                setError("No resume ID provided");
                setLoading(false);
                return;
            }

            try {
                const data = await kv.get(`resume:${id}`);
                if (data) {
                    const resumeData = JSON.parse(data);
                    setResume(resumeData);
                } else {
                    setError("Resume not found");
                }
            } catch (err) {
                setError("Failed to load resume data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadResume();
    }, [id, kv]);

    if (loading) {
        return (
            <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
                <Navbar />
                <section className="main-section">
                    <div className="page-heading py-16">
                        <h2>Loading resume analysis...</h2>
                    </div>
                </section>
            </main>
        );
    }

    if (error || !resume) {
        return (
            <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
                <Navbar />
                <section className="main-section">
                    <div className="page-heading py-16">
                        <h2>Error: {error || "Resume not found"}</h2>
                        <Link to="/" className="primary-button w-fit mt-4">
                            Back to Home
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    const getBadgeColor = (score: number) => {
        if (score >= 80) return "bg-badge-green text-badge-green-text";
        if (score >= 60) return "bg-badge-yellow text-badge-yellow-text";
        return "bg-badge-red text-badge-red-text";
    };

    const categories = [
        { key: 'ATS', label: 'ATS Score', data: resume.feedback.ATS },
        { key: 'content', label: 'Content', data: resume.feedback.content },
        { key: 'structure', label: 'Structure', data: resume.feedback.structure },
        { key: 'toneAndStyle', label: 'Tone & Style', data: resume.feedback.toneAndStyle },
        { key: 'skills', label: 'Skills', data: resume.feedback.skills },
    ];

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />
            
            <section className="main-section">
                <div className="resume-nav">
                    <Link to="/" className="back-button">
                        <img src="/icons/back.svg" alt="back" className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <h3 className="font-semibold">{resume.companyName}</h3>
                            <p className="text-gray-500">{resume.jobTitle}</p>
                        </div>
                        <ScoreCircle score={resume.feedback.overallScore} />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 p-4">
                    {/* Resume Preview */}
                    <div className="lg:w-1/2">
                        <div className="gradient-border">
                            <img
                                src={resume.imagePath}
                                alt="Resume preview"
                                className="w-full h-auto object-cover rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Feedback Section */}
                    <div className="feedback-section">
                        <div className="resume-summary">
                            {categories.map(({ key, label, data }) => (
                                <div key={key} className="category">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{label}</span>
                                    </div>
                                    <div className={`score-badge ${getBadgeColor(data.score)}`}>
                                        <span className="font-semibold">{data.score}/100</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Detailed Feedback */}
                        <div className="space-y-6">
                            {categories.map(({ key, label, data }) => (
                                <div key={key} className="bg-white rounded-lg p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold">{label}</h3>
                                        <div className={`score-badge ${getBadgeColor(data.score)}`}>
                                            <span className="font-semibold">{data.score}/100</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {data.tips.map((tip, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <img
                                                    src={tip.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'}
                                                    alt={tip.type}
                                                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-800">{tip.tip}</p>
                                                    {'explanation' in tip && (
                                                        <p className="text-gray-600 text-sm mt-1">{tip.explanation}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Resume;
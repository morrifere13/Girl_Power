import { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedProject = localStorage.getItem('selectedProject');
        if (storedProject) {
            try {
                setSelectedProject(JSON.parse(storedProject));
            } catch (error) {
                console.error('Error parsing stored project:', error);
                localStorage.removeItem('selectedProject');
            }
        }
        setLoading(false);
    }, []);

    const selectProject = (project) => {
        setSelectedProject(project);
        if (project) {
            localStorage.setItem('selectedProject', JSON.stringify(project));
        } else {
            localStorage.removeItem('selectedProject');
        }
    };

    const clearProject = () => {
        setSelectedProject(null);
        localStorage.removeItem('selectedProject');
    };

    const value = {
        selectedProject,
        selectProject,
        clearProject,
        loading
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
};

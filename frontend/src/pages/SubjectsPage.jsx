import React, { useState } from 'react';
import { useSubjects, useArchiveSubject } from '../hooks/useStudy';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import SubjectForm from '../components/study/SubjectForm';
import { Plus, Archive, BarChart3, Calendar, Tag, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SubjectsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: subjects, isLoading, error } = useSubjects();
  const archiveSubject = useArchiveSubject();

  if (isLoading) return <div className="p-8 text-center text-secondary">Loading subjects...</div>;
  if (error) return <div className="p-8 text-center text-danger">Failed to load subjects.</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 relative min-h-[calc(100vh-8rem)]">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Subjects</h1>
          <p className="text-secondary text-sm">Manage your learning areas</p>
        </div>
      </header>

      {subjects?.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-slate-800 border-dashed">
          <BookOpen size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-secondary italic">No subjects added yet.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} className="mr-2" />
            Add your first subject
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subject => (
            <Card key={subject.id} className="group relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-100 group-hover:text-primary transition-colors">
                  {subject.name}
                </h3>
                <button 
                  onClick={() => archiveSubject.mutate(subject.id)}
                  className="text-slate-600 hover:text-danger p-1 transition-colors"
                  title="Archive Subject"
                >
                  <Archive size={16} />
                </button>
              </div>
              
              {subject.description && (
                <p className="text-sm text-secondary mb-4 line-clamp-2">{subject.description}</p>
              )}
              
              <div className="flex flex-wrap gap-3 mt-auto pt-2 border-t border-slate-800/50">
                <div className="flex items-center gap-1 text-[10px] text-secondary uppercase font-bold tracking-wider">
                  <BarChart3 size={12} className="text-accent" />
                  Diff: {subject.difficulty}/5
                </div>
                {subject.exam_date && (
                  <div className="flex items-center gap-1 text-[10px] text-secondary uppercase font-bold tracking-wider">
                    <Calendar size={12} className="text-primary" />
                    {format(parseISO(subject.exam_date), 'MMM d')}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {subject.tags?.map(tag => (
                    <span key={tag} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-10"
      >
        <Plus size={32} />
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <SubjectForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default SubjectsPage;

interface CurriculumTopic {
  code: string;
  name: string;
  grade: string;
  subject: string;
}

class CurriculumMappingService {
  // Sample NERDC curriculum topics (would be expanded with real data)
  private nerdc: CurriculumTopic[] = [
    { code: 'NERDC-MTH-JSS1-01', name: 'Number and Numeration', grade: 'JSS1', subject: 'Mathematics' },
    { code: 'NERDC-MTH-JSS1-02', name: 'Basic Operations', grade: 'JSS1', subject: 'Mathematics' },
    { code: 'NERDC-MTH-JSS2-01', name: 'Algebraic Processes', grade: 'JSS2', subject: 'Mathematics' },
    { code: 'NERDC-MTH-JSS3-01', name: 'Geometry and Mensuration', grade: 'JSS3', subject: 'Mathematics' },
    { code: 'NERDC-ENG-JSS1-01', name: 'Basic Grammar', grade: 'JSS1', subject: 'English' },
    { code: 'NERDC-ENG-JSS2-01', name: 'Reading Comprehension', grade: 'JSS2', subject: 'English' },
    { code: 'NERDC-SCI-JSS1-01', name: 'Basic Science Concepts', grade: 'JSS1', subject: 'Science' },
    { code: 'NERDC-SCI-JSS2-01', name: 'Living and Non-living Things', grade: 'JSS2', subject: 'Science' },
  ];

  // Sample WAEC curriculum topics
  private waec: CurriculumTopic[] = [
    { code: 'WAEC-MTH-01', name: 'Number and Numeration', grade: 'SSCE', subject: 'Mathematics' },
    { code: 'WAEC-MTH-02', name: 'Algebraic Processes', grade: 'SSCE', subject: 'Mathematics' },
    { code: 'WAEC-ENG-01', name: 'Lexis and Structure', grade: 'SSCE', subject: 'English' },
    { code: 'WAEC-BIO-01', name: 'Cell Biology', grade: 'SSCE', subject: 'Biology' }
  ];

  // Sample NECO curriculum topics
  private neco: CurriculumTopic[] = [
    { code: 'NECO-MTH-01', name: 'Number and Numeration', grade: 'SSCE', subject: 'Mathematics' },
    { code: 'NECO-MTH-02', name: 'Algebraic Processes', grade: 'SSCE', subject: 'Mathematics' },
    { code: 'NECO-ENG-01', name: 'Lexis and Structure', grade: 'SSCE', subject: 'English' },
    { code: 'NECO-BIO-01', name: 'Cell Biology', grade: 'SSCE', subject: 'Biology' }
  ];

  /**
   * Map content to NERDC curriculum
   * @param title Course title
   * @param description Course description
   * @param subject Subject area
   */
  mapToNERDC(title: string, description: string, subject: string): string | null {
    const searchText = `${title} ${description}`.toLowerCase();
    const subjectTopics = this.nerdc.filter(topic => topic.subject.toLowerCase() === subject.toLowerCase());
    
    for (const topic of subjectTopics) {
      if (searchText.includes(topic.name.toLowerCase())) {
        return topic.code;
      }
    }
    
    return null;
  }

  /**
   * Map content to WAEC curriculum
   * @param title Course title
   * @param description Course description
   * @param subject Subject area
   */
  mapToWAEC(title: string, description: string, subject: string): string | null {
    const searchText = `${title} ${description}`.toLowerCase();
    const subjectTopics = this.waec.filter(topic => topic.subject.toLowerCase() === subject.toLowerCase());
    
    for (const topic of subjectTopics) {
      if (searchText.includes(topic.name.toLowerCase())) {
        return topic.code;
      }
    }
    
    return null;
  }

  /**
   * Map content to NECO curriculum
   * @param title Course title
   * @param description Course description
   * @param subject Subject area
   */
  mapToNECO(title: string, description: string, subject: string): string | null {
    const searchText = `${title} ${description}`.toLowerCase();
    const subjectTopics = this.neco.filter(topic => topic.subject.toLowerCase() === subject.toLowerCase());
    
    for (const topic of subjectTopics) {
      if (searchText.includes(topic.name.toLowerCase())) {
        return topic.code;
      }
    }
    
    return null;
  }

  /**
   * Get curriculum topics by subject
   * @param subject Subject area
   * @param curriculum Curriculum system (NERDC, WAEC, NECO)
   */
  getTopicsBySubject(subject: string, curriculum: 'NERDC' | 'WAEC' | 'NECO'): CurriculumTopic[] {
    switch (curriculum) {
      case 'NERDC':
        return this.nerdc.filter(topic => topic.subject.toLowerCase() === subject.toLowerCase());
      case 'WAEC':
        return this.waec.filter(topic => topic.subject.toLowerCase() === subject.toLowerCase());
      case 'NECO':
        return this.neco.filter(topic => topic.subject.toLowerCase() === subject.toLowerCase());
      default:
        return [];
    }
  }
}

export const curriculumMappingService = new CurriculumMappingService();
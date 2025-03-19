import axios from 'axios';
import logger from '../../utils/logger';

class MoodleService {
  private readonly baseUrl: string;
  private readonly wstoken: string;

  constructor() {
    this.baseUrl = process.env.MOODLE_BASE_URL || 'http://localhost:8000';
    this.wstoken = process.env.MOODLE_WS_TOKEN || '';
  }

  /**
   * Create a user in Moodle
   */
  async createUser(userData: {
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    email: string;
  }): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/webservice/rest/server.php`, null, {
        params: {
          wstoken: this.wstoken,
          wsfunction: 'core_user_create_users',
          moodlewsrestformat: 'json',
          users: [userData],
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create Moodle user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all courses from Moodle
   */
  async getCourses(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: this.wstoken,
          wsfunction: 'core_course_get_courses',
          moodlewsrestformat: 'json',
        },
      });

      return response.data.map((course: any) => ({
        original_id: course.id,
        title: course.fullname,
        short_title: course.shortname,
        description: course.summary,
        source: 'moodle',
        type: 'secondary',
        category: course.categoryid,
        format: course.format,
        startDate: new Date(course.startdate * 1000),
        endDate: course.enddate ? new Date(course.enddate * 1000) : null,
      }));
    } catch (error: any) {
      logger.error(`Failed to fetch Moodle courses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enroll a user in a course
   */
  async enrollUser(userId: number, courseId: number, roleId: number = 5): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/webservice/rest/server.php`, null, {
        params: {
          wstoken: this.wstoken,
          wsfunction: 'enrol_manual_enrol_users',
          moodlewsrestformat: 'json',
          enrolments: [
            {
              roleid: roleId, // 5 is the default student role
              userid: userId,
              courseid: courseId,
            },
          ],
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to enroll user in Moodle course: ${error.message}`);
      throw error;
    }
  }
}

export const moodleService = new MoodleService();
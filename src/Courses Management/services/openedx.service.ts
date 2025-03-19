import axios from 'axios';
import logger from '../../utils/logger';

class OpenEdxService {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.OPENEDX_BASE_URL || 'http://localhost:8001';
    this.clientId = process.env.OPENEDX_CLIENT_ID || '';
    this.clientSecret = process.env.OPENEDX_CLIENT_SECRET || '';
  }

  /**
   * Get OAuth2 access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/oauth2/access_token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      if (this.accessToken === null) {
        throw new Error('Access token is null');
      }
      return this.accessToken;
    } catch (error: any) {
      logger.error(`Failed to get Open edX access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a user in Open edX
   */
  async createUser(userData: {
    username: string;
    email: string;
    name: string;
    password: string;
  }): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${this.baseUrl}/api/user/v1/accounts`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create Open edX user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all courses from Open edX
   */
  async getCourses(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/api/courses/v1/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.results.map((course: any) => ({
        original_id: course.id,
        title: course.name,
        short_title: course.course_id,
        description: course.short_description,
        source: 'openedx',
        type: 'university',
        category: course.subject,
        format: 'online',
        startDate: new Date(course.start),
        endDate: course.end ? new Date(course.end) : null,
        media: {
          image_url: course.media.image.raw,
          video_url: course.media.course_video?.uri,
        },
      }));
    } catch (error: any) {
      logger.error(`Failed to fetch Open edX courses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enroll a user in a course
   */
  async enrollUser(username: string, courseId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${this.baseUrl}/api/enrollment/v1/enrollment`,
        {
          user: username,
          course_details: {
            course_id: courseId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to enroll user in Open edX course: ${error.message}`);
      throw error;
    }
  }
}

export const openEdxService = new OpenEdxService();
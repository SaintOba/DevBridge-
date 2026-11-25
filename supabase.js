// Supabase Configuration
// Initialize Supabase client with your credentials

const SUPABASE_URL = 'https://fsuhpjlyzojioezdjjld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdWhwamx5em9qaW9lemRqamxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjIxNDksImV4cCI6MjA5Mjc5ODE0OX0.IkNVBJrpPKCuW9cKfuRNMWCa2mqjuerYWNUhuDdunlM';

// Simple Supabase client implementation
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    async request(method, endpoint, data = null) {
        const token = (typeof Auth !== 'undefined' && Auth.isLoggedIn())
            ? Auth.getSession().access_token
            : this.key;
        const options = {
            method,
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.url}/rest/v1${endpoint}`, options);
        if (!response.ok) {
            const error = await response.json();
            console.error('Supabase error:', error);
            throw new Error(error.message || 'Request failed');
        }
        return await response.json();
    }

    // Jobs table methods
    async getJobs() {
        return this.request('GET', '/jobs?order=created_at.desc');
    }

    async addJob(data) {
        return this.request('POST', '/jobs', data);
    }

    async updateJob(id, data) {
        return this.request('PATCH', `/jobs?id=eq.${id}`, data);
    }

    async deleteJob(id) {
        return this.request('DELETE', `/jobs?id=eq.${id}`);
    }

    // Applications table methods
    async getApplications() {
        return this.request('GET', '/applications?order=created_at.desc');
    }

    async addApplication(data) {
        return this.request('POST', '/applications', data);
    }

    async updateApplication(id, data) {
        return this.request('PATCH', `/applications?id=eq.${id}`, data);
    }

    async getApplicationsByJobId(jobId) {
        return this.request('GET', `/applications?job_id=eq.${jobId}`);
    }

    // Submissions table methods
    async getSubmissions() {
        return this.request('GET', '/submissions?order=created_at.desc');
    }

    async addSubmission(data) {
        return this.request('POST', '/submissions', data);
    }

    async updateSubmission(id, data) {
        return this.request('PATCH', `/submissions?id=eq.${id}`, data);
    }

    // Polling method for real-time updates (since realtime requires more setup)
    async startPollingJobs(callback, interval = 3000) {
        if (window.jobsPollingInterval) {
            clearInterval(window.jobsPollingInterval);
        }

        // Compare the actual job content, not just how many jobs there are.
        // Comparing only jobs.length misses: an edit to an existing job's
        // title/description (count unchanged), and one job added at the same
        // time another is deleted (count also unchanged).
        let lastSignature = '';

        const signatureOf = (jobs) => JSON.stringify(
            jobs.map(j => [
                j.id, j.title, j.description, j.type, j.difficulty,
                j.duration, j.slots, (j.skills || []).join(',')
            ])
        );

        window.jobsPollingInterval = setInterval(async () => {
            try {
                const jobs = await this.getJobs();
                const signature = signatureOf(jobs);
                if (signature !== lastSignature) {
                    lastSignature = signature;
                    callback(jobs);
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, interval);
    }

    stopPollingJobs() {
        if (window.jobsPollingInterval) {
            clearInterval(window.jobsPollingInterval);
            window.jobsPollingInterval = null;
        }
    }
}

// Initialize global Supabase client
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

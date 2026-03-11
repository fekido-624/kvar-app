'use server';
/**
 * @fileOverview An AI agent to generate secure passwords and standardized usernames.
 *
 * - generateSecureCredentials - A function that handles the generation process.
 * - GenerateCredentialsInput - The input type for the generateSecureCredentials function.
 * - GenerateCredentialsOutput - The return type for the generateSecureCredentials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCredentialsInputSchema = z.object({
  firstName: z.string().describe('The first name of the user.'),
  lastName: z.string().describe('The last name of the user.'),
  email: z.string().optional().describe('The email of the user (optional, for username generation).'),
});
export type GenerateCredentialsInput = z.infer<typeof GenerateCredentialsInputSchema>;

const GenerateCredentialsOutputSchema = z.object({
  username: z.string().describe('A standardized and unique username.'),
  password: z.string().describe('A strong and secure password.'),
});
export type GenerateCredentialsOutput = z.infer<typeof GenerateCredentialsOutputSchema>;

export async function generateSecureCredentials(input: GenerateCredentialsInput): Promise<GenerateCredentialsOutput> {
  return generateSecureCredentialsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSecureCredentialsPrompt',
  input: {schema: GenerateCredentialsInputSchema},
  output: {schema: GenerateCredentialsOutputSchema},
  prompt: `You are a security expert. Generate a strong, secure password and a standardized username based on the provided user details.

For the password:
- It must be at least 12 characters long.
- It must include a mix of uppercase letters, lowercase letters, numbers, and symbols.
- It should not be easily guessable.

For the username:
- It should be in a standardized format, preferably "firstInitialLastName" (e.g., for "John Doe", the username would be "jdoe").
- If an email is provided, you may use parts of it for inspiration but prioritize the firstInitialLastName format.

User Details:
First Name: {{{firstName}}}
Last Name: {{{lastName}}}
{{#if email}}Email: {{{email}}}{{/if}}

Please provide the output in JSON format, strictly adhering to the schema.`,
});

const generateSecureCredentialsFlow = ai.defineFlow(
  {
    name: 'generateSecureCredentialsFlow',
    inputSchema: GenerateCredentialsInputSchema,
    outputSchema: GenerateCredentialsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

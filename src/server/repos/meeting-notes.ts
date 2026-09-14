import "server-only";
import { query } from "@/lib/session";
import type { MeetingNote } from "@/domain/types";

const SELECT = `
  select m.id, m.prospect_id, p.company_name as prospect_name, m.opportunity_id,
         o.code as opportunity_code, m.meeting_date, m.location, m.attendees, m.summary,
         m.next_action, m.next_action_date, u.full_name as created_by_name, m.created_at
  from meeting_notes m
  join prospects p on p.id = m.prospect_id
  join users u on u.id = m.created_by
  left join opportunities o on o.id = m.opportunity_id
`;

interface Row {
  id: string;
  prospect_id: string;
  prospect_name: string;
  opportunity_id: string | null;
  opportunity_code: string | null;
  meeting_date: string;
  location: string | null;
  attendees: string;
  summary: string;
  next_action: string | null;
  next_action_date: string | null;
  created_by_name: string;
  created_at: Date;
}

function map(row: Row): MeetingNote {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    prospectName: row.prospect_name,
    opportunityId: row.opportunity_id,
    opportunityCode: row.opportunity_code,
    meetingDate: row.meeting_date,
    location: row.location,
    attendees: row.attendees,
    summary: row.summary,
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    createdByName: row.created_by_name,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listMeetingNotesByProspect(prospectId: string): Promise<MeetingNote[]> {
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} where m.prospect_id = $1 order by m.meeting_date desc, m.created_at desc`,
      [prospectId]
    );
    return result.rows.map(map);
  });
}

export async function listMeetingNotesByOpportunity(
  opportunityId: string
): Promise<MeetingNote[]> {
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT} where m.opportunity_id = $1 order by m.meeting_date desc`,
      [opportunityId]
    );
    return result.rows.map(map);
  });
}

/** Upcoming follow-ups across the pipeline, for the dashboard action list. */
export async function listUpcomingFollowUps(limit = 6): Promise<MeetingNote[]> {
  return query(async (client) => {
    const result = await client.query<Row>(
      `${SELECT}
       where m.next_action_date is not null and m.next_action_date >= current_date
       order by m.next_action_date asc
       limit $1`,
      [limit]
    );
    return result.rows.map(map);
  });
}

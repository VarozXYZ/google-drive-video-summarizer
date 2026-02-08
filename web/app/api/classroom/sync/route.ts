import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGoogleAccessToken } from "@/lib/google/tokens";

const CLASSROOM_COURSES_ENDPOINT = "https://classroom.googleapis.com/v1/courses";

type ClassroomCourse = {
  id: string;
  name?: string;
  section?: string;
  courseState?: string;
  teacherFolder?: {
    id?: string;
    title?: string;
  };
  courseFolder?: {
    id?: string;
    title?: string;
  };
};

async function fetchAllCourses(accessToken: string) {
  const courses: ClassroomCourse[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      courseStates: "ACTIVE",
      pageSize: "100",
      fields: "nextPageToken,courses(id,name,section,courseState,teacherFolder,courseFolder)",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`${CLASSROOM_COURSES_ENDPOINT}?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to load Classroom courses.");
    }

    const payload = (await response.json()) as {
      courses?: ClassroomCourse[];
      nextPageToken?: string;
    };

    courses.push(...(payload.courses || []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return courses;
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessToken } = await getGoogleAccessToken(user.id);
    const courses = await fetchAllCourses(accessToken);

    if (!courses.length) {
      return NextResponse.json({ data: [] });
    }

    const rows = courses.map((course) => ({
      user_id: user.id,
      name: course.name ?? "Untitled course",
      classroom_id: course.id,
      drive_folder_id:
        course.teacherFolder?.id ?? course.courseFolder?.id ?? null,
    }));

    const { data, error } = await supabase
      .from("subjects")
      .upsert(rows, { onConflict: "user_id,classroom_id" })
      .select()
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed." },
      { status: 400 }
    );
  }
}

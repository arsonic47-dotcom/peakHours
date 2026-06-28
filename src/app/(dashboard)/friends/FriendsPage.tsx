"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/lib/store/uiStore";
import { Search, UserPlus, Users, X } from "lucide-react";

interface ProfileSearchResult {
  id: string;
  display_name: string;
}

interface Friend {
  id: string;
  display_name: string;
  friends_since: string;
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";
}

export function FriendsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useUIStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true);
    const { data, error } = await supabase.rpc("list_friends");
    if (error) {
      showToast(error.message || "Failed to load friends", "error");
    } else {
      setFriends(data || []);
    }
    setLoadingFriends(false);
  }, [showToast, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadFriends();
    });
  }, [loadFriends]);

  const handleSearch = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setResults([]);
      showToast("Search with at least 2 letters", "info");
      return;
    }

    setSearching(true);
    const { data, error } = await supabase.rpc("search_profiles_by_display_name", {
      search_query: cleanQuery,
    });
    if (error) {
      showToast(error.message || "Search failed", "error");
    } else {
      setResults(data || []);
    }
    setSearching(false);
  };

  const handleAddFriend = async (friendId: string) => {
    setBusyId(friendId);
    const { error } = await supabase.rpc("add_friend", { target_user_id: friendId });
    if (error) {
      showToast(error.message || "Could not add friend", "error");
    } else {
      showToast("Friend added", "success");
      setResults((current) => current.filter((result) => result.id !== friendId));
      await loadFriends();
    }
    setBusyId(null);
  };

  const handleRemoveFriend = async (friendId: string) => {
    setBusyId(friendId);
    const { error } = await supabase.rpc("remove_friend", { target_user_id: friendId });
    if (error) {
      showToast(error.message || "Could not remove friend", "error");
    } else {
      showToast("Friend removed", "info");
      setFriends((current) => current.filter((friend) => friend.id !== friendId));
    }
    setBusyId(null);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Friends</h1>
        <p className="text-text-secondary mt-1">Find other climbers by display name and add them to your circle.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              id="friend-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search display names..."
              icon={<Search size={18} />}
            />
          </div>
          <Button type="submit" loading={searching} className="sm:w-32">
            Search
          </Button>
        </form>

        <div className="mt-5 space-y-3">
          {results.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700">
                  {initialsFor(profile.display_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{profile.display_name}</p>
                  <p className="truncate text-xs text-text-tertiary">{profile.id}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleAddFriend(profile.id)}
                loading={busyId === profile.id}
                className="shrink-0"
              >
                <UserPlus size={15} />
                Add
              </Button>
            </div>
          ))}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-text-tertiary">
              No matching climbers found.
            </p>
          )}
        </div>
      </Card>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600" />
          <CardTitle>Your Friends</CardTitle>
        </div>

        {loadingFriends ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" variant="rectangular" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-primary-200" />
            <CardTitle className="text-base">No friends yet</CardTitle>
            <CardDescription className="mt-1">Search by display name to add your first climbing partner.</CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {friends.map((friend) => (
              <Card key={friend.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
                      {initialsFor(friend.display_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">{friend.display_name}</p>
                      <p className="text-xs text-text-tertiary">
                        Friends since {new Date(friend.friends_since).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFriend(friend.id)}
                    disabled={busyId === friend.id}
                    className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-error disabled:opacity-50"
                    aria-label={`Remove ${friend.display_name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

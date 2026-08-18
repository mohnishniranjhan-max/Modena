import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
};

export const useRecipes = () => {
  const { data, error, isLoading, mutate } = useSWR(
    '/wp-json/modena/v1/recipes',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  );

  return {
    recipes: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refreshRecipes: mutate
  };
};

export const fetchRecipeBySlug = async (slug) => {
  if (!slug) return null;
  try {
    const res = await fetch(`/wp-json/modena/v1/recipes/${slug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching recipe by slug:', err);
  }
  return null;
};

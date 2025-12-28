-- Migration: Unique Constraints für citation_libraries
-- Verhindert doppelte Standardbibliotheken und Race Conditions

-- Nur eine Standardbibliothek pro User erlauben
-- Dies verhindert 409 Conflicts beim Erstellen der Standardbibliothek
CREATE UNIQUE INDEX IF NOT EXISTS citation_libraries_user_default_unique 
ON public.citation_libraries(user_id) 
WHERE is_default = true;

-- Optional: Verhindert doppelte Bibliotheksnamen pro User
-- Kommentiert aus, falls mehrere Bibliotheken mit gleichem Namen erlaubt sein sollen
-- CREATE UNIQUE INDEX IF NOT EXISTS citation_libraries_user_name_unique 
-- ON public.citation_libraries(user_id, name);

-- Kommentar: Diese Migration behebt das 409 Conflict Problem, indem sie
-- sicherstellt, dass nur eine Standardbibliothek pro User existieren kann.
-- Wenn versucht wird, eine zweite zu erstellen, wird ein eindeutiger Fehler
-- zurückgegeben, der besser behandelt werden kann als ein generischer 409.


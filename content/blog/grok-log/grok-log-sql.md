---
author: 'Joe Lauletta'
date: 2025-05-10
title: 'grok-log-sql'
tags: ['tech']

# draft: true
---

## As I studied an open-source codebase with intent to contribute, I used [ChatGPT](https://chatgpt.com) as a note-taking tool. This is my side of one of our conversations.

---

answer the questions commented in the below code:

```
CREATE DATABASE tattlelog;
USE tattlelog;

/* CREATE */

CREATE TABLE entries (
	id INT NOT NULL AUTO_INCREMENT,
	entry_name VARCHAR(255),
	description VARCHAR(255),
	image VARCHAR(255),
	hp INT,
	atk INT,
	def INT,
	PRIMARY KEY (id)
);

CREATE TABLE locations (
	id INT NOT NULL AUTO_INCREMENT,
    location_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

/* POPULATE */

INSERT INTO entries (entry_name, description, image, hp, atk, def)
 VALUES ('Goomba', 'The underling of underlings. No other distinguishing characteristics', 'https://static.wikia.nocookie.net/papermario/images/1/1f/180px-PMTTYD_Tattle_Log_-_Goomba.png/revision/latest?cb=20171215010923', 2, 1, 0), ('Paragoomba', 'Goomba with wings. Can\'t reach it with a hammer while it\'s in the air, but once it\'s damaged, its wings get clipped. It\'s kind of sad really.', 'https://static.wikia.nocookie.net/papermario/images/d/d9/180px-PMTTYD_Tattle_Log_-_Paragoomba.png/revision/latest?cb=20171214023412', 2, 1, 0), ('Spiked Goomba', 'A Goomba that wears a spiked helmet. Slighty higher attack power than a typical Goomba.', 'https://static.wikia.nocookie.net/papermario/images/6/6d/180px-PMTTYD_Tattle_Log_-_Spiky_Goomba.png/revision/latest?cb=20171214023540', 2, 2, 0), ('Hyper Goomba', 'When this hyperactive Goomba charges up, its Attack rises to eight, so watch yourself!', 'https://static.wikia.nocookie.net/papermario/images/9/9b/180px-PMTTYD_Tattle_Log_-_Hyper_Goomba.png/revision/latest?cb=20171214023600', 8, 2, 0), ('Hyper Paragoomba', 'When this winged Hyper Goomba charges up, its attack power rises to 8.', 'https://static.wikia.nocookie.net/papermario/images/0/07/180px-PMTTYD_Tattle_Log_-_Hyper_Paragoomba.png/revision/latest?cb=20171214023642', 8, 2, 0), ('Hyper Spiky Goomba', 'When this hyperactive spike-headed Hyper Goomba charges up, its Attack rises to nine, so heads up!', 'https://static.wikia.nocookie.net/papermario/images/1/1d/180px-PMTTYD_Tattle_Log_-_Hyper_Spiky_Goomba.png/revision/latest?cb=20171214023857', 8, 3, 0), ('Gloomba', 'A Goomba that likes dark, damp places. It must look like that because it lives below ground.', 'https://static.wikia.nocookie.net/papermario/images/6/6a/180px-PMTTYD_Tattle_Log_-_Gloomba.png/revision/latest?cb=20171214024015', 7, 3, 0), ('Paragloomba', 'A Gloomba with wings that may or may not get moldy.', 'https://static.wikia.nocookie.net/papermario/images/6/6b/180px-PMTTYD_Tattle_Log_-_Paragloomba.png/revision/latest?cb=20171214024044', 7, 3, 0), ('Spiky Gloomba', 'A Gloomba with a painful-looking spike that likes damp places.', 'https://static.wikia.nocookie.net/papermario/images/1/11/180px-PMTTYD_Tattle_Log_-_Spiky_Gloomba.png/revision/latest?cb=20171214024105', 7, 4, 0), ('Koopa Troopa', 'Koopa Troopas have been around forever. Jump on them to flip them over and drop their defense to 0.', 'https://static.wikia.nocookie.net/papermario/images/9/9d/180px-PMTTYD_Tattle_Log_-_Koopa_Troopa.png/revision/latest?cb=20171214024126', 4, 2, 1), ('Paratroopa', 'A Koopa Troopa with wings that stays airborne until you stomp on it and send it plunging to the ground.', 'https://static.wikia.nocookie.net/papermario/images/1/19/180px-PMTTYD_Tattle_Log_-_Paratroopa.png/revision/latest?cb=20171214024157', 4, 2, 1), ('KP Koopa', 'A Koopa warrior that battles at the Glitz Pit in Glitzville. It may be a different color than your average Koopa, but its abilities are the same.', 'https://static.wikia.nocookie.net/papermario/images/6/67/180px-PMTTYD_Tattle_Log_-_KP_Koopa.png/revision/latest?cb=20171214024215', 4, 2, 1), ('KP Paratroopa', 'A Koopa Paratroopa who\'s dyed its shell. Otherwise, it\'s the same as any other Paratroopa, which means one stomp and it loses its wings.', 'https://static.wikia.nocookie.net/papermario/images/f/f4/180px-PMTTYD_Tattle_Log_-_KP_Paratroopa.png/revision/latest?cb=20171214024236', 4, 2, 1), ('Shady Koopa', 'When a Shady Koopa flips back up from its back, it attack increases. Shady Koopas have a place of honor in the Koopa family tree because of this distinction.', 'https://static.wikia.nocookie.net/papermario/images/8/87/180px-PMTTYD_Tattle_Log_-_Shady_Koopa.png/revision/latest?cb=20171214024343', 8, 3, 1), ('Shady Paratroopa', 'Other than having wings, this creature isn\'t very different from a Shady Koopa. Once it flips off its back, it boosts its attack.', 'https://static.wikia.nocookie.net/papermario/images/1/18/180px-PMTTYD_Tattle_Log_-_Shady_Paratroopa.png/revision/latest?cb=20171214024356', 8, 3, 1), ('Dark Koopa', 'A Koopa that prefers dark places. It has a very hard shell but you can flip it by jumping on it.', 'https://static.wikia.nocookie.net/papermario/images/1/18/180px-PMTTYD_Tattle_Log_-_Shady_Paratroopa.png/revision/latest?cb=20171214024356', 8, 4, 2), ('Dark Paratroopa', 'A Paratroopa that lives in dark, damp places. In has a very hard shell, but you can flip it over by jumping on it.', 'https://static.wikia.nocookie.net/papermario/images/c/cf/180px-PMTTYD_Tattle_Log_-_Dark_Paratroopa.png/revision/latest?cb=20171214024444', 8, 4, 2), ('Koopatrol', 'Occasionally uses an attack called Charge that saves up energy, and can call in backup for support if you don\'t defeat it quickly.', 'https://static.wikia.nocookie.net/papermario/images/e/e6/180px-PMTTYD_Tattle_Log_-_Koopatrol.png/revision/latest?cb=20171214024503', 6, 4, 2), ('Dark Koopatrol', 'A member of the elite forces of the Koopa clan. Its pair of red eyes is its most charming feature. After charging its attacks, it deals devastating blows, so watch yourself!', 'https://static.wikia.nocookie.net/papermario/images/a/ab/180px-PMTTYD_Tattle_Log_-_Dark_Koopatrol.png/revision/latest?cb=20171214024521', 25, 5, 2), ('Dull Bones', 'A Koopa Troopa that became a skeleton. It throws bones to attack and builds buddies to help it fight.', 'https://static.wikia.nocookie.net/papermario/images/2/24/180px-PMTTYD_Tattle_Log_-_Dull_Bones.png/revision/latest?cb=20171214024537', 1, 2, 1);
 
INSERT INTO locations (location_name)
VALUES ('boggly woods'), ('boo\'s mansion'), ('creepy steeple'), ('excess express'), ('fahr         outpost'), ('glitz pit'), ('glitzville'), ('hooktail castle'), ('keelhaul key'), ('palace of shadow'), ('petal meadows'), ('pirate\'s grotto'), ('pit of 100 trials'), ('poshley sanctum'), ('riverside station'), ('rogueport'), ('rogueport sewers'), ('shhwonk fortress'), ('the great tree'), ('the moon'), ('twilight trail');

/* QUERY */
 
SELECT id, name, description, image, hp, atk, def
FROM entries;

SELECT * FROM entries;

SELECT * FROM entries LIMIT 5;

SELECT name FROM entries;

SELECT id AS 'ID', name AS 'Entry name'
FROM entries;

SELECT * FROM entries ORDER BY name;

SELECT * FROM entries
WHERE id < 6;

/* AGGREGATE */ 

SELECT AVG(atk) FROM entries;
SELECT AVG(hp) FROM entries;

SELECT atk, COUNT(atk) FROM entries
GROUP by atk; /* atk frequency, according to atk value */

SELECT atk, COUNT(atk) FROM entries
GROUP by atk; /* atk frequency, according to atk value */

SELECT * FROM entries
WHERE name LIKE '%Spik%';
 
/* JOIN TABLE - LINKS ENTRIES AND LOCATIONS (MANY-TO-MANY) */

CREATE TABLE entry_locations (
	entry_id  int NOT NULL,
    location_id int NOT NULL,
    CONSTRAINT PK_entry_locations PRIMARY KEY (
		entry_id,
        location_id
    ),
    FOREIGN KEY (entry_id) REFERENCES entries(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
 
/* AUTISM (is there a way of automating this?) */

INSERT INTO entry_locations (entry_id, location_id)
VALUES (1, 17), (1, 11), (1, 18), (1, 8), (1, 7), (2, 17), (2, 11), (2, 18), (2, 8), (3, 17), (3, 11), (3, 18), (3, 8), (4, 21), (5, 21), (6, 21), (7, 13), (8, 13), (9, 13), (10, 11), (10, 18), (10, 8), (11, 11), (11, 18), (11, 8), (12, 6), (13, 6), (14, 6), (14, 13), (15, 6), (16, 13), (17, 13), (18, 17), (19, 7), (19, 13), (20, 8), (20, 7), (20, 10), (20, 13);

/* Question: Huh? */
/*

    One-to-many: 

    SELECT * FROM master (thing with many things related to it)
    JOIN slave ON master; 

*/
 
/* Question: Instead of a join table, can you just add entries FK "locations" + locations FK "entries"? */
/* Question: Why SELECT * FROM entry_locations sufficient? What happens if you simply query a join table without JOIN? This reads like we're setting the entry_id and location_id fields redundantly. */
SELECT * FROM entry_locations
JOIN entries ON entries.id = entry_locations.entry_id
JOIN locations ON locations.id = entry_locations.location_id;

/* ALIAS TABLE - display results not by ID but by associated entry / location name */

/* Question: How does entry_name replace entry_id? If entry_locations REFERENCES entries(id) only, how can "entry_name AS entry" locate entry_name? */
SELECT entry_name AS entry, location_name AS location FROM entry_locations
JOIN entries ON entries.id = entry_locations.entry_id
JOIN locations ON locations.id = entry_locations.location_id;
```

---

So to express locations on an entry record, you're saying it's not just more efficient but necessary to pull matching join table location fields rather than matches directly from the locations table?

---

in the latter case i mentioned, would the location records you pull from necessarily reference entry fields? could the redundancy be avoided by strictly pulling the location name field rather than the whole record?

---

I'm not understanding that tables /shouldn't/ reference other tables when REFERENCES is built into SQL. in this app, the users table has a key that references specific notation records (field "notations").

---

so it's not possible in sql for a field to reference entire fields of another table? it must be a single field?

---

```
/* Question: How does entry_name replace entry_id? If entry_locations REFERENCES entries(id) only, how can "entry_name AS entry" locate entry_name? */
SELECT entry_name AS entry, location_name AS location FROM entry_locations
JOIN entries ON entries.id = entry_locations.entry_id
JOIN locations ON locations.id = entry_locations.location_id;
```

---

"Otherwise you're just getting a lookup table — not human-readable."

By this do you mean `SELECT * FROM entry_locations` will return the list of tuples as inserted?

---

Then would this query not simply replace the lookup table ids with the same ids?

```
SELECT * FROM entry_locations 
JOIN entries ON entries.id = entry_locations.entry_id
JOIN locations ON locations.id = entry_locations.location_id;
```

---

So basic join syntax is [table] ON [index], and it returns all columns of the rows referenced. ALIAS is required to intentionally limit what's returned?

---

So:

```
/* for each entry_locations record, pull the entries and locations records whose ids match the entry_locations record fields, and return their name fields as a tuple. */
SELECT entry_name AS entry, location_name AS location FROM entry_locations
JOIN entries ON entries.id = entry_locations.entry_id
JOIN locations ON locations.id = entry_locations.location_id;
```

Are we returning the respective name fields of each set of matching records as a new tuple, or are they "taking the place" of entry_id and location_id positionally?

---

```
SELECT * FROM entry_locations
JOIN entries ON entries.id = entry_locations.entry_id
JOIN locations ON locations.id = entry_locations.location_id;
```

So then, for each entry_locations record, this query returns all fields of the matching entry and locations records as one row? Does each row have a primary key?

---

But the entry_locations portion of the result table is technically the PK for each row... (entry.id, location.id) is treated as a single PK

---

result tables don't inherently have PKs, but a join table's rows are themselves composite PKs.

---

obviously, trigram indexes are more meant for strings than integers. but could it technically be used to gauge similarity of numbers with at least three digits, for things like zip code misspelling handling in frontend search queries? is there an ideal algorithm for numbers, or do default indexes do the job? and how many indexes should a table with 5 or 6 columns have? would it be reasonable to do:

```
CREATE INDEX index_notations_on_hp ON entries (hp);
CREATE INDEX index_notations_on_atk ON entries (atk);
CREATE INDEX index_notations_on_def ON entries (def);
```

if my table is:

```
CREATE TABLE entries (
	id INT NOT NULL AUTO_INCREMENT,
	entry_name VARCHAR(255),
	description VARCHAR(255),
	image VARCHAR(255),
	hp INT,
	atk INT,
	def INT,
	PRIMARY KEY (id)
);
```

?

---

```
@ManyToMany({ 
    entity: () => TagEntity,
    inversedBy: 'notations',
    joinColumn: 'notation_id',
    inverseJoinColumn: 'tag_id',
    pivotTable: 'notation_tags',
    hidden: true,
  })
  tags = new Collection<TagEntity>(this);
```

Is this ORM foreign key declaration doing the equivalent of:

```
SELECT * FROM notation_tags 
JOIN tags ON tag.id = notation_tags.tag_id
```

?

---

So this flow is consistent with the fact that standard tables themselves don't implement their many-to-many relationships -- they're handled entirely by a join table. however, one-to-many presumably is declared in the tables, but the implementation is different from each side of the relation. in a books / authors scenario, how would the REFERENCES line look on either table?

---

so one-to-many is only declared on the "many" side of the relation. 

---

is the books FK referencing only an author record id field, or the entire author record?

---

got it, so pulling entire foreign records requires join. it's just the authors(id) syntax that makes me think "return authors record whose id is id"

---

So in ORMs, for @OneToMany, the implementation is actually iterating over the many side and aggregating those records with matching author_id FKs.

---

Why do you suppose applyQuery() applies an inner join, but applyTagIds() applies a left join?
 
```
// Pull 10 notation records, joined with their matching user columns, that are positioned after the current cursor and are similar to the query in terms of song name, artist name, or joined user username.
const applyQuery = (b: QueryBuilder, query: string | null) => { 
  if (query) {
    b.join('users', 'users.id', 'notations.transcriber_id').where((b) => {
      b.orWhere('notations.song_name', 'ilike', query);
      b.orWhere('notations.artist_name', 'ilike', query);
      b.orWhere('users.username', 'ilike', query);
    });
  }
};

const applyTagIds = (b: QueryBuilder, tagIds: string[] | null) => {
  if (tagIds) {
    b.leftJoin('notation_tags', 'notation_tags.notation_id', 'notations.id')
      .whereIn('notation_tags.tag_id', tagIds)
      .groupBy('notations.id')
      .having(sql.raw('count(distinct(notation_tags.tag_id)) >= ?', tagIds.length));
  }
};

export const findNotationPageQuery = (args: FindNotationPageQueryArgs): string => {
  const { cursor, limit, pagingType, tagIds, query } = args;
  const isPagingBackward = pagingType === PagingType.BACKWARD;

  const b = sql
    .select('notations.*')
    .from('notations')
    .where('notations.cursor', isPagingBackward ? '<' : '>', cursor)
    .where('notations.private', '=', false)
    .orderBy('notations.cursor', isPagingBackward ? 'desc' : 'asc')
    .limit(limit);

  applyQuery(b, query);
  applyTagIds(b, tagIds);

  return b.toString();
};
```

---

But in production, a notation record must have a transcriber field, and thus a related users record.

---
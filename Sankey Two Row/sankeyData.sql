--Get top 5 industries
WITH ind as 
(select Industry, count(*) as companies
from unicorn_companies
group by industry
order by 2 desc
fetch first 5 rows only
), co as 
(
    select country, count(*)
    from unicorn_companies
    where industry in (select industry from ind)
    group by country
    order by 2 desc
    fetch first 7 rows only
)
select JSON_OBJECT(
    KEY 'nodes' VALUE (
        select JSON_ARRAYAGG(
            json_object(
                KEY 'id' value id,
                KEY 'name' value id,
                KEY 'category' value category
                returning clob
            )returning clob
        )from (
                
            (select industry id, 'industry' category from ind)
            UNION
            (select country id, 'country' category from co)
          
        )        
    ),
    KEY 'links' value (
        select JSON_ARRAYAGG(
            json_object(
                KEY 'ID' value CONCAT('L',TO_CHAR(ROWNUM)),
                KEY 'source' value origin,
                KEY 'target' value target,
                KEY 'items' value count_normalized,
                KEY 'count' value count
                returning clob
            )returning clob
        ) from (with g as ( 
        
       select country origin, 
            industry target, 
            CASE 
                                        WHEN count(*) > 1000 THEN 20
                                        WHEN count(*) between 101 and 1000 THEN 15
                                        WHEN count(*) between 11 and 100 then 10
                                        when count(*) between 1 and 10 then count(*)
            END count_normalized,
            count(*) count
        from unicorn_companies
        where industry in (select industry from ind)
        and country in (select country from co)
        group by country, industry
        order by 3 desc
        )

            select rownum, g.* from g)
    )returning clob
) AS JSON
into :P3_JSON_SANKEY
FROM DUAL;
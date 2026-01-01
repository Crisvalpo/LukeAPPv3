// OPTIMIZED VERSION - Replace lines 339-418 in material-catalog.ts

try {
    // OPTIMIZED: Batch operations (1 SELECT + 1 INSERT + N parallel UPDATEs per chunk)

    // Step 1: Single query to get ALL existing items in this chunk
    const chunkIdents = chunk.map(item => item.ident_code)
    const { data: existingItems } = await supabase
        .from('material_catalog')
        .select('id, ident_code, spec_code')
        .eq('project_id', projectId)
        .in('ident_code', chunkIdents)

    // Step 2: Build lookup map (key = ident|||spec)
    const existingMap = new Map<string, string>()
    existingItems?.forEach(e => {
        const key = `${e.ident_code}|||${e.spec_code || ''}`
        existingMap.set(key, e.id)
    })

    // Step 3: Separate into new vs existing
    const toInsert: any[] = []
    const toUpdate: any[] = []

    chunk.forEach(item => {
        const fullItem = {
            project_id: projectId,
            company_id: companyId,
            ...item
        }

        const key = `${item.ident_code}|||${item.spec_code || ''}`
        const existingId = existingMap.get(key)

        if (existingId) {
            if (overwrite) {
                toUpdate.push({ id: existingId, ...fullItem })
            } else {
                skipped++
            }
        } else {
            toInsert.push(fullItem)
        }
    })

    // Step 4: Batch INSERT all new items (FAST!)
    if (toInsert.length > 0) {
        const { error: insertError, data: insertedData } = await supabase
            .from('material_catalog')
            .insert(toInsert)
            .select()

        if (insertError) {
            errors.push(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} INSERT error: ${insertError.message}`)
        } else {
            inserted += (insertedData?.length || 0)
        }
    }

    // Step 5: Parallel UPDATE for existing items (if overwrite mode)
    if (toUpdate.length > 0) {
        const updatePromises = toUpdate.map(item =>
            supabase.from('material_catalog')
                .update(item)
                .eq('id', item.id)
        )

        const results = await Promise.allSettled(updatePromises)

        results.forEach((result, idx) => {
            if (result.status === 'fulfilled' && !result.value.error) {
                updated++
            } else {
                const failedItem = toUpdate[idx]
                errors.push(`Update failed: ${failedItem.ident_code}`)
            }
        })
    }

    if (onProgress) {
        onProgress(Math.min(i + CHUNK_SIZE, total), total)
    }

} catch (error: any) {

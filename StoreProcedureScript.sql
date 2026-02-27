USE [DHTN-2025]
GO
/****** Object:  StoredProcedure [dbo].[Prc_StaffSubmission]    Script Date: 1/19/2026 9:40:07 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[Prc_StaffSubmission]
    @DepartmentId  INT,
    @UnitId        INT = NULL,
    @RoleCode      NVARCHAR(255),
    @PositionCode  NVARCHAR(255),
    @Type NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF OBJECT_ID('tempdb..#RolesNeed') IS NOT NULL DROP TABLE #RolesNeed;
        IF OBJECT_ID('tempdb..#DeptTree')  IS NOT NULL DROP TABLE #DeptTree;
        IF OBJECT_ID('tempdb..#RolesNeedTrinhCuc') IS NOT NULL DROP TABLE #RolesNeedTrinhCuc;
        IF OBJECT_ID('tempdb..#DeptTreeTrinhCuc')  IS NOT NULL DROP TABLE #DeptTreeTrinhCuc;
        DECLARE @ParentId INT, @Level INT, @ParentLevel INT;
        DECLARE @thuoctrungtam BIT = 0;
        DECLARE @TopParentId INT;
        DECLARE @IsUnit BIT = 0;
        DECLARE @IsCNTT NVARCHAR(MAX) = NULL;
        DECLARE @IsLDHanhChinh BIT = 0;
        DECLARE @curId INT = @ParentId, @curLevel INT;
        DECLARE @RoleId_LanhDaoDonVi      INT,
        @RoleId_LanhDaoHanhChinh  INT,
        @RoleId_LanhDaoPhong      INT,
        @RoleId_LanhDaoTrungTam   INT;
        DECLARE @TreeRootId INT;
        DECLARE @IsLead INT;

        SELECT TOP 1 @IsLead = Position.Type FROM Position Where Code = @PositionCode

        IF @IsLead IS NULL
        BEGIN
            RAISERROR('PositionCode không tồn tại: %s', 16, 1, @PositionCode);
            RETURN;
        END

        SELECT @ParentId = ParentId, @Level = [Level]
        FROM dbo.Department (NOLOCK)
        WHERE Id = @DepartmentId;
        SELECT @ParentLevel = [Level], @IsUnit = IsUnit, @IsCNTT = Code
        FROM dbo.Department (NOLOCK)
        WHERE Id = @ParentId;
        --Tìm xem vụ có phòng hay vụ không có phòng
        DECLARE @TypeChild INT, @ChildDepartmentIds NVARCHAR(MAX);
        DECLARE @HasChild BIT;
        SELECT 
            @TypeChild = d.Type,
            @ChildDepartmentIds = ISNULL((
                STUFF((
                    SELECT ',' + CAST(c.Id AS VARCHAR(20))
                    FROM dbo.Department c (NOLOCK)
                    WHERE c.ParentId = d.Id
                    FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)')
                ,1,1,'')
            ), '')
        FROM dbo.Department d (NOLOCK)
        WHERE d.Id = @DepartmentId and d.Id != 1 AND d.Type != 10 AND d.Type != 6;

        SET @HasChild = CASE 
                    WHEN @ChildDepartmentIds = '' THEN 0
                    ELSE 1
        END;

        IF(@Type = 'TRINH_VU')
        BEGIN

        IF (@Level = 3 AND @ParentLevel = 3) SET @thuoctrungtam = 1;

        IF @UnitId IS NOT NULL
            SET @TopParentId = @UnitId;
        ELSE
        BEGIN
            WHILE 1=1
            BEGIN
                SELECT @curLevel = [Level], @ParentId = ParentId
                FROM dbo.Department (NOLOCK)
                WHERE Id = @curId;

                IF @curLevel = 2 
                BEGIN
                    SET @TopParentId = @curId;
                    BREAK;
                END

                IF @ParentId IS NULL BREAK;
                SET @curId = @ParentId;
            END
        END

        SELECT 
            @RoleId_LanhDaoDonVi      = MAX(CASE WHEN Code = 'LanhDaoDonVi'     THEN Id END),
            @RoleId_LanhDaoHanhChinh  = MAX(CASE WHEN Code = 'LanhDaoHanhChinh' THEN Id END),
            @RoleId_LanhDaoPhong      = MAX(CASE WHEN Code = 'LanhDaoPhong'     THEN Id END),
            @RoleId_LanhDaoTrungTam   = MAX(CASE WHEN Code = 'LanhDaoTrungTam'  THEN Id END)
        FROM dbo.Role (NOLOCK)
        WHERE UnitId = @TopParentId;

        CREATE TABLE #RolesNeed
        (
            RoleId          INT           NOT NULL,
            RequirePosition NVARCHAR(255) NULL,
            IsLead INT NULL
        );

        ------------------------------------------------------------
        -- LOGIC PHÂN CẤP VAI TRÒ MỚI (2025-10)
        ------------------------------------------------------------
        -- ChuyenVien → LanhDaoPhong
        IF @RoleCode = N'ChuyenVien' AND @HasChild = 0
        BEGIN
            IF @RoleId_LanhDaoPhong IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoPhong, NULL, NULL);
        END

        ELSE IF @RoleCode = N'ChuyenVien' AND @HasChild = 1
        BEGIN
            IF @RoleId_LanhDaoPhong     IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoPhong, NULL, NULL);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, NULL, NULL);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'CucTruong', 1);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'VuTruong', 1);
        END

        -- LanhDaoPhong.PhoTruongPhong (thuộc trung tâm) → TruongPhong, LanhDaoTrungTam, LanhDaoDonVi
--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'PhoTruongPhong' AND @thuoctrungtam = 1
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND @thuoctrungtam = 1
        BEGIN
            IF @RoleId_LanhDaoPhong    IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoPhong, N'TruongPhong', 1);
            IF @RoleId_LanhDaoTrungTam IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoTrungTam, NULL, NULL);
            IF @RoleId_LanhDaoDonVi    IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, NULL, NULL);
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'CucTruong', 1);
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'VuTruong', 1);
        END

        -- LanhDaoPhong.TruongPhong (thuộc trung tâm) → LanhDaoTrungTam , LanhDaoDonVi
--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 1
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 1 AND @thuoctrungtam = 1
        BEGIN
            IF @RoleId_LanhDaoTrungTam IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoTrungTam, NULL, NULL);
            IF @RoleId_LanhDaoDonVi    IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, NULL, NULL);
        END

        -- LanhDaoPhong.PhoTruongPhong (không thuộc trung tâm) → TruongPhong, LanhDaoHanhChinh, LanhDaoDonVi
--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'PhoTruongPhong' AND @thuoctrungtam = 0
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND @thuoctrungtam = 0
        BEGIN
            IF @RoleId_LanhDaoPhong     IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoPhong, N'TruongPhong', 1);
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, NULL, NULL);
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'CucTruong', 1);
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'VuTruong', 1);
        END

        -- LanhDaoPhong.TruongPhong (không thuộc trung tâm) → LanhDaoHanhChinh, LanhDaoDonVi
--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 0
--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 0
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 1 AND @thuoctrungtam = 0
        BEGIN
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, NULL, NULL);
        END

        -- LanhDaoDonVi.PhoCucTruong/PhoVuTruong → CucTruong/VuTruong
--         ELSE IF @RoleCode = N'LanhDaoDonVi' AND @PositionCode IN (N'PhoCucTruong', N'PhoVuTruong')
        ELSE IF @RoleCode = N'LanhDaoDonVi' AND @IsLead = 2
        BEGIN
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'CucTruong', 1);
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'VuTruong', 1);
        END

--         ELSE IF @RoleCode = N'LanhDaoDonVi' AND @PositionCode IN (N'CucTruong', N'VuTruong')
        ELSE IF @RoleCode = N'LanhDaoDonVi' AND @IsLead = 1
        BEGIN
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'CucTruong', 1);
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeed VALUES (@RoleId_LanhDaoDonVi, N'VuTruong', 1);
        END

        ------------------------------------------------------------

        --trả về hoàn toàn không có kết quả (empty result set)
        IF NOT EXISTS (SELECT 1 FROM #RolesNeed)
        BEGIN
            SELECT TOP 0
                   s.Id, s.DepartmentId, s.UnitId, s.PositionId,
                   CAST('' AS NVARCHAR(255)) AS PositionName,
                   CAST('' AS NVARCHAR(255)) AS UnitName,
                   CAST('' AS NVARCHAR(255)) AS DepartmentName,
                   s.Code, s.FirstName, s.LastName,
                   s.Gender, CAST('' AS NVARCHAR(255)) AS GenderName,
                   s.UserName, s.Email, s.Phone, s.Mobile,
                   s.SignImage,
                   CAST('' AS NVARCHAR(255)) AS RoleCode,
                   CAST('' AS NVARCHAR(255)) AS RoleName,
                   CAST(0 AS INT)            AS RoleId
            FROM dbo.Staff s WHERE 1 = 0;
            RETURN;
        END

        CREATE TABLE #DeptTree (Id INT PRIMARY KEY);

        IF EXISTS (SELECT 1 FROM #RolesNeed rn WHERE rn.RoleId = ISNULL(@RoleId_LanhDaoTrungTam, -1))
            SET @TreeRootId = @ParentId;
        ELSE IF EXISTS (SELECT 1 FROM #RolesNeed rn WHERE rn.RoleId IN (ISNULL(@RoleId_LanhDaoHanhChinh,-1), ISNULL(@RoleId_LanhDaoDonVi,-1)))
            SET @TreeRootId = @TopParentId;
        ELSE
            SET @TreeRootId = @DepartmentId;

        ;WITH DeptTree AS (
            SELECT Id FROM dbo.Department WHERE Id = @TreeRootId
            UNION ALL
            SELECT d.Id
            FROM dbo.Department d
            INNER JOIN DeptTree dt ON d.ParentId = dt.Id
        )
        INSERT INTO #DeptTree(Id)
        SELECT Id FROM DeptTree;

        --------------------------------------------------------------------
        -- TRINH_VU: đảm bảo với Phó phòng luôn có Trưởng phòng + lãnh đạo
        -- cấp trên; nếu thiếu lãnh đạo cấp trên thì fallback lên các cấp.
        --------------------------------------------------------------------

        -- Kết quả tạm cho TRINH_VU
        IF OBJECT_ID('tempdb..#ResultTrinhVu') IS NOT NULL DROP TABLE #ResultTrinhVu;

        CREATE TABLE #ResultTrinhVu
        (
            Id              INT,
            DepartmentId    INT,
            UnitId          INT,
            PositionId      INT,
            PositionName    NVARCHAR(255),
            UnitName        NVARCHAR(255),
            DepartmentName  NVARCHAR(255),
            Code            NVARCHAR(255),
            FirstName       NVARCHAR(255),
            LastName        NVARCHAR(255),
            Gender          TINYINT,
            GenderName      NVARCHAR(255),
            UserName        NVARCHAR(255),
            Email           NVARCHAR(255),
            Phone           NVARCHAR(255),
            Mobile          NVARCHAR(255),
            SignImage       NVARCHAR(MAX),
            RoleCode        NVARCHAR(255),
            RoleName        NVARCHAR(255),
            RoleId          INT
        );

        -- Lần 1: dùng logic hiện tại
        INSERT INTO #ResultTrinhVu
        SELECT DISTINCT
               s.Id, ros.DepartmentId, r.UnitId, ros.PositionId,
               ISNULL(p.Name, '') AS PositionName,
               d.Name AS UnitName,
               dd.Name AS DepartmentName,
               s.Code, s.FirstName, s.LastName,
               s.Gender, cfg.DisplayName AS GenderName,
               s.UserName, s.Email, s.Phone, s.Mobile,
               s.SignImage,
               r.Code AS RoleCode, r.Name AS RoleName, r.Id AS RoleId
        FROM dbo.Staff s (NOLOCK)
        LEFT JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = s.Id
        LEFT JOIN dbo.Role r (NOLOCK)          ON r.Id = ros.RoleId
        INNER JOIN dbo.Department d (NOLOCK)    ON d.Id = r.UnitId
        INNER JOIN dbo.Department dd (NOLOCK)   ON dd.Id = ros.DepartmentId
        LEFT  JOIN dbo.Position p (NOLOCK)      ON p.Id = ros.PositionId
        LEFT  JOIN dbo.Configuration cfg (NOLOCK) 
               ON cfg.Code = 'StaffGender'
              AND TRY_CAST(cfg.Value AS TINYINT) = s.Gender
        INNER JOIN #RolesNeed rn
--                ON rn.RoleId = r.Id AND (rn.RequirePosition IS NULL OR p.Code = rn.RequirePosition)
               ON rn.RoleId = r.Id AND (rn.RequirePosition IS NULL OR p.Code = rn.RequirePosition) AND (rn.IsLead IS NULL OR p.Type = rn.IsLead)
        WHERE s.IsDeleted = 0
        --AND ros.PositionId = 
        --AND ros.DepartmentId = @DepartmentId
        AND (p.Code != @PositionCode OR (r.Code != @RoleCode)) 
          AND (
        -- TRƯỜNG HỢP 1: LÃNH ĐẠO PHÒNG (Phó phòng, Trưởng phòng)
       (@RoleCode = 'LanhDaoPhong' AND (
           -- Lấy Trưởng phòng CÙNG PHÒNG
--            (ros.DepartmentId = @DepartmentId AND p.Code = 'TruongPhong')
           (ros.DepartmentId = @DepartmentId AND p.Type = 1)
           OR 
           -- Lấy Lãnh đạo cấp cao (Trung tâm, Hành chính, Đơn vị) - CÙNG ĐƠN VỊ
           (ros.DepartmentId IN (SELECT Id FROM #DeptTree) AND r.Id IN (@RoleId_LanhDaoTrungTam, @RoleId_LanhDaoHanhChinh, @RoleId_LanhDaoDonVi))
       ))
       OR
       -- TRƯỜNG HỢP 2: CHUYÊN VIÊN - chỉ lấy trong cùng phòng
       (@RoleCode = 'ChuyenVien' AND ros.DepartmentId = @DepartmentId)
       OR
       -- TRƯỜNG HỢP 3: LÃNH ĐẠO ĐƠN VỊ - lấy theo logic hiện tại
--        ((@RoleCode = N'LanhDaoDonVi' and @PositionCode = 'PhoVuTruong') AND (ros.DepartmentId = @DepartmentId))
       ((@RoleCode = N'LanhDaoDonVi' and @IsLead = 2) AND (ros.DepartmentId = @DepartmentId))
       OR
--        ((@RoleCode = N'LanhDaoDonVi' and @PositionCode = 'VuTruong') AND (ros.DepartmentId = @DepartmentId OR ros.DepartmentId IN (SELECT Id FROM #DeptTree WHERE Id <> @DepartmentId)))
       ((@RoleCode = N'LanhDaoDonVi' and @IsLead = 1) AND (ros.DepartmentId = @DepartmentId OR ros.DepartmentId IN (SELECT Id FROM #DeptTree WHERE Id <> @DepartmentId)))
  );

                --------------------------------------------------------------
        -- Fallback cho Phó phòng: cần có Trưởng phòng + lãnh đạo trên
        --------------------------------------------------------------
        DECLARE @HasTruongPhong_TV BIT = 0;
        DECLARE @HasLanhDaoCapTren_TV BIT = 0;

        -- Kiểm tra sau lần 1
        IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2
        BEGIN
            -- Có Trưởng phòng cùng phòng?
            IF EXISTS (
                SELECT 1 FROM #ResultTrinhVu rt
                INNER JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = rt.Id AND ros.DepartmentId = rt.DepartmentId
                INNER JOIN dbo.Position p (NOLOCK) ON p.Id = ros.PositionId
                WHERE rt.DepartmentId = @DepartmentId AND p.Type = 1
            )
                SET @HasTruongPhong_TV = 1;

            -- Có lãnh đạo cấp trên (Trung tâm, Hành chính, Đơn vị)?
            IF EXISTS (
                SELECT 1 FROM #ResultTrinhVu rt
                WHERE rt.RoleId IN (@RoleId_LanhDaoTrungTam, @RoleId_LanhDaoHanhChinh, @RoleId_LanhDaoDonVi)
            )
                SET @HasLanhDaoCapTren_TV = 1;
        END

        -- Nếu là Phó phòng mà thiếu lãnh đạo cấp trên, hoặc hoàn toàn không có ai → fallback
        IF (@RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND @HasLanhDaoCapTren_TV = 0)
           OR NOT EXISTS (SELECT 1 FROM #ResultTrinhVu)
        BEGIN
            DECLARE @FallbackRoles_TV TABLE (Priority INT IDENTITY(1,1), RoleId INT);

            IF @RoleId_LanhDaoTrungTam IS NOT NULL 
                INSERT INTO @FallbackRoles_TV(RoleId) VALUES (@RoleId_LanhDaoTrungTam);
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL 
                INSERT INTO @FallbackRoles_TV(RoleId) VALUES (@RoleId_LanhDaoHanhChinh);
            IF @RoleId_LanhDaoDonVi IS NOT NULL 
                INSERT INTO @FallbackRoles_TV(RoleId) VALUES (@RoleId_LanhDaoDonVi);

            DECLARE @CurPri_TV INT = 1, @MaxPri_TV INT, @TryRoleId_TV INT;
            SELECT @MaxPri_TV = MAX(Priority) FROM @FallbackRoles_TV;

            WHILE @CurPri_TV IS NOT NULL AND @CurPri_TV <= ISNULL(@MaxPri_TV,0)
            BEGIN
                SELECT @TryRoleId_TV = RoleId FROM @FallbackRoles_TV WHERE Priority = @CurPri_TV;
                IF @TryRoleId_TV IS NULL BREAK;

                DELETE FROM #RolesNeed;
                INSERT INTO #RolesNeed VALUES (@TryRoleId_TV, NULL, NULL);

                INSERT INTO #ResultTrinhVu
                SELECT DISTINCT
                       s.Id, ros.DepartmentId, r.UnitId, ros.PositionId,
                       ISNULL(p.Name, '') AS PositionName,
                       d.Name AS UnitName,
                       dd.Name AS DepartmentName,
                       s.Code, s.FirstName, s.LastName,
                       s.Gender, cfg.DisplayName AS GenderName,
                       s.UserName, s.Email, s.Phone, s.Mobile,
                       s.SignImage,
                       r.Code AS RoleCode, r.Name AS RoleName, r.Id AS RoleId
                FROM dbo.Staff s (NOLOCK)
                LEFT JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = s.Id
                LEFT JOIN dbo.Role r (NOLOCK)          ON r.Id = ros.RoleId
                INNER JOIN dbo.Department d (NOLOCK)    ON d.Id = r.UnitId
                INNER JOIN dbo.Department dd (NOLOCK)   ON dd.Id = ros.DepartmentId
                LEFT  JOIN dbo.Position p (NOLOCK)      ON p.Id = ros.PositionId
                LEFT  JOIN dbo.Configuration cfg (NOLOCK) 
                       ON cfg.Code = 'StaffGender'
                      AND TRY_CAST(cfg.Value AS TINYINT) = s.Gender
                INNER JOIN #RolesNeed rn
                       ON rn.RoleId = r.Id AND (rn.RequirePosition IS NULL OR p.Code = rn.RequirePosition) AND (rn.IsLead IS NULL OR p.Type = rn.IsLead)
                WHERE s.IsDeleted = 0
                  AND (p.Code != @PositionCode OR (r.Code != @RoleCode))
                  AND ros.DepartmentId IN (SELECT Id FROM #DeptTree)
                  -- Với Phó phòng: ở bước fallback chỉ lấy lãnh đạo cấp trên (không lấy lại Trưởng phòng)
                  AND NOT (@RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND ros.DepartmentId = @DepartmentId AND p.Type = 1);

                -- Sau mỗi lần insert, kiểm tra điều kiện dừng
                IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2
                BEGIN
                    -- Trưởng phòng có thể đã có từ lần đầu
                    IF @HasTruongPhong_TV = 0
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM #ResultTrinhVu rt
                            INNER JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = rt.Id AND ros.DepartmentId = rt.DepartmentId
                            INNER JOIN dbo.Position p (NOLOCK) ON p.Id = ros.PositionId
                            WHERE rt.DepartmentId = @DepartmentId AND p.Type = 1
                        )
                            SET @HasTruongPhong_TV = 1;
                    END

                    IF EXISTS (
                        SELECT 1 FROM #ResultTrinhVu rt
                        WHERE rt.RoleId IN (@RoleId_LanhDaoTrungTam, @RoleId_LanhDaoHanhChinh, @RoleId_LanhDaoDonVi)
                    )
                        SET @HasLanhDaoCapTren_TV = 1;

                    IF @HasTruongPhong_TV = 1 AND @HasLanhDaoCapTren_TV = 1
                        BREAK;
                END
                ELSE
                BEGIN
                    IF EXISTS (SELECT 1 FROM #ResultTrinhVu)
                        BREAK;
                END

                SET @CurPri_TV = @CurPri_TV + 1;
            END
        END

        SELECT DISTINCT
               Id, DepartmentId, UnitId, PositionId,
               PositionName,
               UnitName,
               DepartmentName,
               Code, FirstName, LastName,
               Gender, GenderName,
               UserName, Email, Phone, Mobile,
               SignImage,
               RoleCode, RoleName, RoleId
        FROM #ResultTrinhVu;

        END
        IF(@Type = 'DONG_TRINH')
        BEGIN

       SELECT DISTINCT
       s.Id, 
       ros.DepartmentId,  -- Alias để khớp với cấu trúc
       r.UnitId, 
       ros.PositionId,
       ISNULL(p.Name, '') AS PositionName,
       d.Name AS UnitName,
       dd.Name AS DepartmentName,
       s.Code, 
       s.FirstName, 
       s.LastName,
       s.Gender, 
       cfg.DisplayName AS GenderName,
       s.UserName, 
       s.Email, 
       s.Phone, 
       s.Mobile,
       s.SignImage,
       r.Code AS RoleCode, 
       r.Name AS RoleName, 
       r.Id AS RoleId
       FROM dbo.Staff s (NOLOCK)
       LEFT JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = s.Id
       LEFT JOIN dbo.Role r (NOLOCK) ON r.Id = ros.RoleId
       INNER JOIN dbo.Department d (NOLOCK) ON d.Id = r.UnitId
       INNER JOIN dbo.Department dd (NOLOCK) ON dd.Id = ros.DepartmentId
       LEFT JOIN dbo.Position p (NOLOCK) ON p.Id = ros.PositionId
       LEFT JOIN dbo.Configuration cfg (NOLOCK) 
              ON cfg.Code = 'StaffGender'
             AND TRY_CAST(cfg.Value AS TINYINT) = s.Gender
       WHERE s.IsDeleted = 0
         AND r.Code LIKE '%LanhDaoDonVi%'
         AND (@UnitId IS NULL OR (d.Id <> @UnitId))

        END
        IF(@Type = 'TRINH_CUC')
        BEGIN
        --SELECT @ParentId = ParentId, @Level = [Level]
        --FROM dbo.Department (NOLOCK)
        --WHERE Id = @DepartmentId;

        SELECT @ParentLevel = [Level]
        FROM dbo.Department (NOLOCK)
        WHERE Id = @ParentId;

        IF (@Level = 3 AND @ParentLevel = 3) SET @thuoctrungtam = 1;

        IF @UnitId IS NOT NULL
        BEGIN
            --nếu có truyền UnitId thì dùng luôn, bỏ qua bước leo cây
            SET @TopParentId = @UnitId;
        END
        ELSE
        BEGIN
            WHILE 1=1
            BEGIN
                SELECT @curLevel = [Level], @ParentId = ParentId
                FROM dbo.Department (NOLOCK)
                WHERE Id = @curId;

                IF @curLevel = 2 
                BEGIN
                    SET @TopParentId = @curId;
                    BREAK;
                END

                IF @ParentId IS NULL BREAK;
                SET @curId = @ParentId;
            END
        END

        ------------------------------------------------------------
        -- 2) Lấy RoleId (theo mô hình của bạn hiện đang để ở TopParent)
        ------------------------------------------------------------

        SELECT 
            @RoleId_LanhDaoDonVi      = MAX(CASE WHEN Code = 'LanhDaoDonVi'     THEN Id END),
            @RoleId_LanhDaoHanhChinh  = MAX(CASE WHEN Code = 'LanhDaoHanhChinh' THEN Id END),
            @RoleId_LanhDaoPhong      = MAX(CASE WHEN Code = 'LanhDaoPhong'     THEN Id END),
            @RoleId_LanhDaoTrungTam   = MAX(CASE WHEN Code = 'LanhDaoTrungTam'  THEN Id END)
        FROM dbo.Role (NOLOCK)
        WHERE UnitId = @TopParentId;

        ------------------------------------------------------------
        -- 3) #RolesNeedTrinhCuc: chỉ insert khi RoleId KHÁC NULL
        ------------------------------------------------------------
        CREATE TABLE #RolesNeedTrinhCuc
        (
            RoleId INT NOT NULL,
            RequirePosition NVARCHAR(255) NULL
            ,IsLead INT NULL
        );
        -- ChuyenVien -> LanhDaoPhong
        IF @RoleCode = N'ChuyenVien'
        BEGIN
            IF @RoleId_LanhDaoPhong IS NOT NULL
                INSERT INTO #RolesNeedTrinhCuc(RoleId, RequirePosition, IsLead) VALUES (@RoleId_LanhDaoPhong, NULL, NULL);
        END

        -- LanhDaoPhong (3-3-2 hoặc 3-2)
--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'PhoTruongPhong' AND @thuoctrungtam = 1
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND @thuoctrungtam = 1
        BEGIN
        IF @RoleId_LanhDaoPhong IS NOT NULL and @IsCNTT != 'G12.30'
            BEGIN
                INSERT INTO #RolesNeedTrinhCuc
                VALUES
                (
                    CASE 
                        WHEN @RoleId_LanhDaoTrungTam IS NOT NULL THEN @RoleId_LanhDaoTrungTam
                        ELSE @RoleId_LanhDaoDonVi
                    END,
                    NULL,
                    NULL
                );
                INSERT INTO #RolesNeedTrinhCuc
                VALUES
                (
                    CASE 
                        WHEN @RoleId_LanhDaoPhong IS NOT NULL THEN  @RoleId_LanhDaoPhong
                        ELSE @RoleId_LanhDaoDonVi
                    END,
                    CASE 
--                         WHEN @RoleId_LanhDaoPhong IS NOT NULL THEN  N'TruongPhong'
                        WHEN @RoleId_LanhDaoPhong IS NOT NULL THEN  N'TruongPhong'
                        ELSE NULL
                    END,
                    1
                );
            END
            ELSE
            BEGIN
            IF @RoleId_LanhDaoPhong IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoPhong, N'TruongPhong', 1);
            --IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL);
            IF @RoleId_LanhDaoTrungTam IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoTrungTam, NULL, NULL);
            --IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi,     NULL);
            END
        END

        -- LanhDaoPhong.TruongPhong (thuộc trung tâm) → LanhDaoTrungTam , LanhDaoDonVi
--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 1 AND @HasChild = 1
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 1 AND @thuoctrungtam = 1 AND @HasChild = 1
        BEGIN
            IF @RoleId_LanhDaoTrungTam IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoTrungTam, NULL, NULL);
            IF @RoleId_LanhDaoTrungTam  IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoTrungTam,  N'GiamDoc', 1);
            --IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL);
        END

--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 1
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 1 AND @thuoctrungtam = 1
        BEGIN
            IF @RoleId_LanhDaoTrungTam IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoTrungTam, NULL, NULL);
        END

--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'PhoTruongPhong' AND @thuoctrungtam = 0 
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND @thuoctrungtam = 0 
        BEGIN
            IF @RoleId_LanhDaoPhong IS NOT NULL and @IsCNTT != 'G12.30'
            BEGIN
                INSERT INTO #RolesNeedTrinhCuc
                VALUES
                (
                    CASE 
                        WHEN @RoleId_LanhDaoHanhChinh IS NOT NULL THEN @RoleId_LanhDaoHanhChinh
                        ELSE @RoleId_LanhDaoDonVi
                    END,
                    NULL,
                    NULL
                );
                INSERT INTO #RolesNeedTrinhCuc
                VALUES
                (
                    CASE 
                        WHEN @RoleId_LanhDaoPhong IS NOT NULL THEN  @RoleId_LanhDaoPhong
                        ELSE @RoleId_LanhDaoDonVi
                    END,
                    CASE 
                        WHEN @RoleId_LanhDaoPhong IS NOT NULL THEN  N'TruongPhong'
                        ELSE NULL
                    END,
                    1
                );
            END
            ELSE
            BEGIN
            IF @RoleId_LanhDaoPhong IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoPhong, N'TruongPhong', 1);
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
            --IF @RoleId_LanhDaoTrungTam IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoTrungTam, NULL);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi,     NULL, NULL);
            END

        END

--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 0 AND @HasChild = 1 AND @IsUnit = 0
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 1 AND @thuoctrungtam = 0 AND @HasChild = 1 AND @IsUnit = 0
        BEGIN
         IF @RoleId_LanhDaoPhong IS NOT NULL and @IsCNTT != 'G12.30'
            BEGIN
                INSERT INTO #RolesNeedTrinhCuc
                VALUES
                (
                    CASE 
                        WHEN @RoleId_LanhDaoHanhChinh IS NOT NULL THEN @RoleId_LanhDaoHanhChinh
                        ELSE @RoleId_LanhDaoDonVi
                    END,
                    NULL,
                    NULL
                );
            END
            ELSE
            BEGIN
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi,     NULL, NULL);
            END
        END

--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 0 AND @HasChild = 1 AND @IsUnit = 1
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 1 AND @thuoctrungtam = 0 AND @HasChild = 1 AND @IsUnit = 1
        BEGIN
            IF @RoleId_LanhDaoPhong IS NOT NULL and @IsCNTT != 'G12.30'
            BEGIN
                INSERT INTO #RolesNeedTrinhCuc
                VALUES
                ( 
                    CASE 
                        WHEN @RoleId_LanhDaoHanhChinh IS NOT NULL THEN @RoleId_LanhDaoHanhChinh
                        ELSE @RoleId_LanhDaoDonVi
                    END,
                    NULL,
                    NULL
                );
            END
            ELSE
            BEGIN
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi,     NULL, NULL);
            END
        END

--         ELSE IF @RoleCode = N'LanhDaoPhong' AND @PositionCode = N'TruongPhong' AND @thuoctrungtam = 0
        ELSE IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 1 AND @thuoctrungtam = 0
        BEGIN
            IF @RoleId_LanhDaoPhong IS NOT NULL and @IsCNTT != 'G12.30'
            BEGIN
                INSERT INTO #RolesNeedTrinhCuc
                VALUES
                (
                    CASE 
                        WHEN @RoleId_LanhDaoHanhChinh IS NOT NULL THEN @RoleId_LanhDaoHanhChinh
                        ELSE @RoleId_LanhDaoDonVi
                    END,
                    NULL,
                    NULL
                );
            END
            ELSE
            BEGIN
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
			IF @RoleId_LanhDaoDonVi    IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi, N'CucTruong', 1);
			IF @RoleId_LanhDaoDonVi    IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi, N'PhoCucTruong', 2);
            END
        END

        -- LanhDaoTrungTam (dùng PhoGiamDoc/GiamDoc)
--         ELSE IF @RoleCode = N'LanhDaoTrungTam' AND @PositionCode = N'PhoGiamDoc'
        ELSE IF @RoleCode = N'LanhDaoTrungTam' AND @IsLead = 2
        BEGIN
            IF @RoleId_LanhDaoTrungTam  IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoTrungTam,  N'GiamDoc', 1);
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
        END

--         ELSE IF @RoleCode = N'LanhDaoTrungTam' AND @PositionCode = N'GiamDoc'
        ELSE IF @RoleCode = N'LanhDaoTrungTam' AND @IsLead = 1
        BEGIN
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL, NULL);
        END

        -- LanhDaoHanhChinh (PhoChanhVanPhong/ChanhVanPhong)
--         ELSE IF (@RoleCode = N'LanhDaoHanhChinh' OR @RoleCode = N'LanhDaoDonVi' ) AND (@PositionCode = N'PhoChanhVanPhong' OR @PositionCode = N'PhoTruongPhong')
        ELSE IF (@RoleCode = N'LanhDaoHanhChinh') AND @IsLead = 2
        BEGIN
            IF @RoleId_LanhDaoHanhChinh IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoHanhChinh, NULL, 1);
            IF @RoleId_LanhDaoDonVi     IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi,     NULL, NULL);
        END
            
--         ELSE IF @RoleCode = N'LanhDaoHanhChinh' AND @PositionCode = N'ChanhVanPhong'
        ELSE IF @RoleCode = N'LanhDaoHanhChinh' AND @IsLead = 1
        BEGIN
        print(@RoleId_LanhDaoDonVi)
        print(@RoleId_LanhDaoHanhChinh)
        print('3233')
        --EXEC [dbo].[Prc_StaffSubmission] @DepartmentId = 4828, @UnitId = 4387, @RoleCode = N'LanhDaoHanhChinh', @PositionCode = N'TruongPhong', @Type = N'TRINH_CUC'
         
            IF @RoleId_LanhDaoDonVi IS NOT NULL INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi, NULL, NULL);
        END

        -- LanhDaoDonVi (PhoCucTruong/PhoVuTruong -> CucTruong/VuTruong)
--         ELSE IF @RoleCode = N'LanhDaoDonVi' AND @PositionCode = N'PhoCucTruong'
        ELSE IF @RoleCode = N'LanhDaoDonVi' AND @IsLead = 2
        BEGIN
            IF @RoleId_LanhDaoDonVi IS NOT NULL 
            BEGIN
                INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi, N'CucTruong', 1);
                INSERT INTO #RolesNeedTrinhCuc VALUES (@RoleId_LanhDaoDonVi, N'VuTruong', 1);
            END
        END

--         ELSE IF @RoleCode = N'LanhDaoDonVi' AND @PositionCode = N'PhoVuTruong'
--         ELSE IF @RoleCode = N'LanhDaoDonVi' AND @PositionCode = N'PhoVuTruong'

        ------------------------------------------------------------
        -- Nếu #RolesNeedTrinhCuc rỗng -> trả rỗng luôn (tránh scan vô ích)
        ------------------------------------------------------------


        IF NOT EXISTS (SELECT 1 FROM #RolesNeedTrinhCuc)
        BEGIN
            SELECT TOP 0
                   s.Id, s.DepartmentId, s.UnitId, s.PositionId,
                   CAST('' AS NVARCHAR(255)) AS PositionName,
                   CAST('' AS NVARCHAR(255)) AS UnitName,
                   CAST('' AS NVARCHAR(255)) AS DepartmentName,
                   s.Code, s.FirstName, s.LastName,
                   s.Gender, CAST('' AS NVARCHAR(255)) AS GenderName,
                   s.UserName, s.Email, s.Phone, s.Mobile,
                   s.SignImage,
                   CAST('' AS NVARCHAR(255)) AS RoleCode,
                   CAST('' AS NVARCHAR(255)) AS RoleName,
                   CAST(0 AS INT)            AS RoleId
            FROM dbo.Staff s WHERE 1 = 0;
            RETURN;
        END
        ------------------------------------------------------------
        -- 4) #DeptTreeTrinhCuc: CHỌN ROOT THEO NỘI DUNG #RolesNeedTrinhCuc
        ------------------------------------------------------------
        CREATE TABLE #DeptTreeTrinhCuc (Id INT PRIMARY KEY);

        IF EXISTS (SELECT 1 FROM #RolesNeedTrinhCuc rn WHERE rn.RoleId = ISNULL(@RoleId_LanhDaoTrungTam, -1))
            SET @TreeRootId = @ParentId;
        ELSE IF EXISTS (SELECT 1 FROM #RolesNeedTrinhCuc rn WHERE rn.RoleId IN (ISNULL(@RoleId_LanhDaoHanhChinh,-1), ISNULL(@RoleId_LanhDaoDonVi,-1)))
            SET @TreeRootId = @TopParentId;
        ELSE
            SET @TreeRootId = @DepartmentId;

        ;WITH DeptTree AS (
            SELECT Id FROM dbo.Department WHERE Id = @TreeRootId
            UNION ALL
            SELECT d.Id
            FROM dbo.Department d
            INNER JOIN DeptTree dt ON d.ParentId = dt.Id
        )
        INSERT INTO #DeptTreeTrinhCuc(Id)
        SELECT Id FROM DeptTree;

        --print('day la roltrinhcuc')
        --select * from #RolesNeedTrinhCuc;
        ------------------------------------------------------------
        CREATE TABLE #ResultTrinhCuc
        (
            Id              INT,
            DepartmentId    INT,
            UnitId          INT,
            PositionId      INT,
            PositionName    NVARCHAR(255),
            PositionCode    NVARCHAR(255),
            RoleCode        NVARCHAR(255),
            RoleName        NVARCHAR(255),
            RoleId          INT,
            PositionType    INT,
            UnitName        NVARCHAR(255),
            DepartmentName  NVARCHAR(255),
            Code            NVARCHAR(255),
            FirstName       NVARCHAR(255),
            LastName        NVARCHAR(255),
            Gender          TINYINT,
            GenderName      NVARCHAR(255),
            UserName        NVARCHAR(255),
            Email           NVARCHAR(255),
            Phone           NVARCHAR(255),
            Mobile          NVARCHAR(255),
            SignImage       NVARCHAR(MAX)
        );

        -- Lần 1: dùng logic hiện tại
        INSERT INTO #ResultTrinhCuc
        SELECT DISTINCT
               s.Id, ros.DepartmentId, r.UnitId, ros.PositionId,
               ISNULL(p.Name, '') AS PositionName,
               ISNULL(p.Code, '') AS PositionCode,
               r.Code AS RoleCode, r.Name AS RoleName,
               r.Id AS RoleId,
               p.Type,
               d.Name AS UnitName,
               dd.Name AS DepartmentName,
               s.Code, s.FirstName, s.LastName,
               s.Gender, cfg.DisplayName AS GenderName,
               s.UserName, s.Email, s.Phone, s.Mobile,
               s.SignImage
               
        FROM dbo.Staff s (NOLOCK)
        LEFT JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = s.Id
        LEFT JOIN dbo.Role r (NOLOCK)          ON r.Id = ros.RoleId
        INNER JOIN dbo.Department d (NOLOCK)    ON d.Id = r.UnitId
        INNER JOIN dbo.Department dd (NOLOCK)   ON dd.Id = ros.DepartmentId
        LEFT  JOIN dbo.Position p (NOLOCK)      ON p.Id = ros.PositionId
        LEFT  JOIN dbo.Configuration cfg (NOLOCK) 
               ON cfg.Code = 'StaffGender'
              AND TRY_CAST(cfg.Value AS TINYINT) = s.Gender
        INNER JOIN #RolesNeedTrinhCuc rn
--                ON rn.RoleId = r.Id AND (rn.RequirePosition IS NULL OR p.Code = rn.RequirePosition)
               ON rn.RoleId = r.Id 
               AND (rn.RequirePosition IS NULL OR p.Code = rn.RequirePosition) AND (rn.IsLead IS NULL OR p.Type = rn.IsLead)
        --WHERE s.IsDeleted = 0
	    --AND ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc);
        WHERE s.IsDeleted = 0
        AND NOT (p.Code = @PositionCode AND r.Code = @RoleCode AND ros.DepartmentId = @DepartmentId)
        --AND r.Code != @RoleCode
            
        --AND ros.DepartmentId = @DepartmentId       
    AND (
    ------------------------------------------------------------
    -- TRƯỜNG HỢP 1: LÃNH ĐẠO PHÒNG (Phó phòng, Trưởng phòng)
    ------------------------------------------------------------
    (
--         (@RoleCode = N'LanhDaoPhong' and @PositionCode = 'PhoTruongPhong')
        ((@RoleCode = N'LanhDaoPhong') and @IsLead = 2)
        AND (
               -- Lấy Trưởng phòng cùng phòng
               (ros.DepartmentId = @DepartmentId AND (p.Type = 1))

               OR -- Lấy lãnh đạo cấp cao (Trung tâm, Hành chính, Đơn vị) trong cùng đơn vị
               (
                   ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
                   AND r.Id IN (
                       @RoleId_LanhDaoTrungTam,
                       @RoleId_LanhDaoHanhChinh,
                       @RoleId_LanhDaoDonVi
                   )
               )
           )
    )
    OR

        (
--         (@RoleCode = N'LanhDaoPhong' and @PositionCode = 'TruongPhong')
        ((@RoleCode = N'LanhDaoPhong') and @IsLead = 1)
        AND (
               (
                   ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
                   AND r.Id IN (
                       @RoleId_LanhDaoTrungTam,
                       @RoleId_LanhDaoHanhChinh,
                       @RoleId_LanhDaoDonVi
                   )
               )
           )
    )

    OR
    ------------------------------------------------------------
    -- TRƯỜNG HỢP 2: CHUYÊN VIÊN - chỉ lấy trong cùng phòng
    ------------------------------------------------------------
    (
        @RoleCode = N'ChuyenVien'
        AND ros.DepartmentId = @DepartmentId
    )

    OR
    ------------------------------------------------------------
    -- TRƯỜNG HỢP 3: LÃNH ĐẠO ĐƠN VỊ - lấy theo logic hiện tại
    ------------------------------------------------------------
    (
--         ((@RoleCode = N'LanhDaoDonVi' and @PositionCode = 'PhoCucTruong') OR (@RoleCode = N'LanhDaoDonVi' and @PositionCode = 'PhoChanhVanPhong'))
        (@RoleCode = N'LanhDaoDonVi' and @IsLead = 2)
        AND (
               ros.DepartmentId = @DepartmentId
            --OR ros.DepartmentId IN (
            --       SELECT Id
            --       FROM #DeptTreeTrinhCuc
            --       WHERE Id <> @DepartmentId
            --   )
           )
    )
    OR
    (
--         ((@RoleCode = N'LanhDaoDonVi' and (@PositionCode = 'CucTruong' OR @PositionCode Like '%Truong%')) OR (@RoleCode = N'LanhDaoDonVi' and @PositionCode = 'ChanhVanPhong'))
        ((@RoleCode = N'LanhDaoDonVi' and @IsLead = 1))
        AND (
            ros.DepartmentId IN (
                   SELECT Id
                   FROM #DeptTreeTrinhCuc
                   WHERE Id <> @DepartmentId
               )
           )
    )

    OR
    --------------------------------------------------------------
    ---- TRƯỜNG HỢP 4: MẶC ĐỊNH - trong cùng cây đơn vị (DeptTree)
    --------------------------------------------------------------
    --ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
    (
        (@RoleCode = N'LanhDaoTrungTam' and @IsLead = 2)
        AND (
               -- Lấy lãnh đạo cùng phòng
               (ros.DepartmentId = @DepartmentId AND (p.Type = 1) and r.Id = @RoleId_LanhDaoTrungTam)

               OR -- Lấy lãnh đạo cấp cao (Trung tâm, Hành chính, Đơn vị) trong cùng đơn vị
               (
                   ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
                   AND r.Id IN (
                       @RoleId_LanhDaoHanhChinh,
                       @RoleId_LanhDaoDonVi
                   )
               )
           )
    )

    OR
    --------------------------------------------------------------
    ---- TRƯỜNG HỢP 4: MẶC ĐỊNH - trong cùng cây đơn vị (DeptTree)
    --------------------------------------------------------------
    --ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
    (
        (@RoleCode = N'LanhDaoTrungTam' and @IsLead = 1)
         AND (
               (
                   ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
                   AND r.Id IN (
                       @RoleId_LanhDaoHanhChinh,
                       @RoleId_LanhDaoDonVi
                   )
               )
           )
    )
        OR
    --------------------------------------------------------------
    ---- TRƯỜNG HỢP 4: MẶC ĐỊNH - trong cùng cây đơn vị (DeptTree)
    --------------------------------------------------------------
    --ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
    (
        (@RoleCode = N'LanhDaoHanhChinh' and @IsLead = 2)
        AND (
               -- Lấy Trưởng VP cùng phòng (Type=1)
               (ros.DepartmentId = @DepartmentId AND p.Type = 1 AND r.Id = @RoleId_LanhDaoHanhChinh)
               OR -- Lấy lãnh đạo cấp trên (Đơn vị) trong cây
               (
                   ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
                   AND r.Id IN (@RoleId_LanhDaoDonVi)
               )
           )
    )

    OR
    --------------------------------------------------------------
    ---- TRƯỜNG HỢP 4: MẶC ĐỊNH - trong cùng cây đơn vị (DeptTree)
    --------------------------------------------------------------
    --ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
    (
        @RoleCode NOT IN (N'LanhDaoPhong', N'ChuyenVien', N'LanhDaoDonVi')
        AND ros.DepartmentId = @DepartmentId
        --AND ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
    )

    );

-- Lần 2: Với Phó phòng (IsLead=2), đảm bảo có cả Trưởng phòng và lãnh đạo cấp trên
        -- Nếu thiếu lãnh đạo cấp trên, tiếp tục leo lên cấp cao hơn
        DECLARE @HasTruongPhong BIT = 0;
        DECLARE @HasLanhDaoCapTren BIT = 0;
        
        -- Kiểm tra xem có Trưởng phòng và lãnh đạo cấp trên trong kết quả không
        IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2
        BEGIN
            -- Kiểm tra có Trưởng phòng không (cùng phòng, Type=1)
            IF EXISTS (
                SELECT 1 FROM #ResultTrinhCuc rt
                INNER JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = rt.Id AND ros.DepartmentId = rt.DepartmentId
                INNER JOIN dbo.Position p (NOLOCK) ON p.Id = ros.PositionId
                WHERE rt.DepartmentId = @DepartmentId AND p.Type = 1
            )
                SET @HasTruongPhong = 1;
            
            -- Kiểm tra có lãnh đạo cấp trên không (Trung tâm, Hành chính, Đơn vị)
            IF EXISTS (
                SELECT 1 FROM #ResultTrinhCuc rt
                WHERE rt.RoleId IN (@RoleId_LanhDaoTrungTam, @RoleId_LanhDaoHanhChinh, @RoleId_LanhDaoDonVi)
            )
                SET @HasLanhDaoCapTren = 1;
        END
        
        -- Nếu là Phó phòng và thiếu lãnh đạo cấp trên, tiếp tục fallback
        IF (@RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND (@HasLanhDaoCapTren = 0 OR NOT EXISTS (SELECT 1 FROM #ResultTrinhCuc)))
        BEGIN
            DECLARE @FallbackRoles TABLE (Priority INT IDENTITY(1,1), RoleId INT);

            -- Bảng mapping thứ tự cấp bậc: Phòng(1) → Trung tâm(2) → Hành chính(3) → Đơn vị(4)
            DECLARE @RoleHierarchy TABLE (RoleCode NVARCHAR(255), Level INT, RoleId INT);
            
            INSERT INTO @RoleHierarchy VALUES (N'LanhDaoPhong', 1, @RoleId_LanhDaoPhong);
            INSERT INTO @RoleHierarchy VALUES (N'LanhDaoTrungTam', 2, @RoleId_LanhDaoTrungTam);
            INSERT INTO @RoleHierarchy VALUES (N'LanhDaoHanhChinh', 3, @RoleId_LanhDaoHanhChinh);
            INSERT INTO @RoleHierarchy VALUES (N'LanhDaoDonVi', 4, @RoleId_LanhDaoDonVi);
            
            -- Lấy level của role hiện tại
            DECLARE @CurrentLevel INT;
            SELECT @CurrentLevel = Level FROM @RoleHierarchy WHERE RoleCode = @RoleCode;
            
            -- Nếu không tìm thấy role hiện tại (ChuyenVien hoặc role khác), set level = 0 để fallback tất cả
            SET @CurrentLevel = ISNULL(@CurrentLevel, 0);
            
            -- Chỉ insert các role có level cao hơn role hiện tại, theo thứ tự tăng dần
            INSERT INTO @FallbackRoles(RoleId)
            SELECT RoleId
            FROM @RoleHierarchy
            WHERE RoleId IS NOT NULL
              AND Level > @CurrentLevel
            ORDER BY Level;

            DECLARE @CurPri INT = 1, @MaxPri INT, @TryRoleId INT;
            SELECT @MaxPri = MAX(Priority) FROM @FallbackRoles;

            -- Với Phó phòng: dừng khi đã có lãnh đạo cấp trên
            -- Với các trường hợp khác: dừng khi đã có bất kỳ ai
            WHILE @CurPri IS NOT NULL AND @CurPri <= ISNULL(@MaxPri,0)
            BEGIN
                SELECT @TryRoleId = RoleId FROM @FallbackRoles WHERE Priority = @CurPri;
                IF @TryRoleId IS NULL BREAK;

                DELETE FROM #RolesNeedTrinhCuc;
                INSERT INTO #RolesNeedTrinhCuc VALUES (@TryRoleId, NULL, NULL);

                -- Rebuild DeptTree phù hợp cấp fallback
                IF OBJECT_ID('tempdb..#DeptTreeTrinhCuc') IS NOT NULL DROP TABLE #DeptTreeTrinhCuc;
                CREATE TABLE #DeptTreeTrinhCuc (Id INT PRIMARY KEY);

                IF @TryRoleId = ISNULL(@RoleId_LanhDaoTrungTam, -1)
                    SET @TreeRootId = @ParentId;
                ELSE IF @TryRoleId IN (ISNULL(@RoleId_LanhDaoHanhChinh,-1), ISNULL(@RoleId_LanhDaoDonVi,-1))
                    SET @TreeRootId = @TopParentId;
                ELSE
                    SET @TreeRootId = @DepartmentId;

                ;WITH DeptTree AS (
                    SELECT Id FROM dbo.Department WHERE Id = @TreeRootId
                    UNION ALL
                    SELECT d.Id
                    FROM dbo.Department d
                    INNER JOIN DeptTree dt ON d.ParentId = dt.Id
                )
                INSERT INTO #DeptTreeTrinhCuc(Id)
                SELECT Id FROM DeptTree;

                INSERT INTO #ResultTrinhCuc
                SELECT DISTINCT
                       s.Id, ros.DepartmentId, r.UnitId, ros.PositionId,
                       ISNULL(p.Name, '') AS PositionName,
                       ISNULL(p.Code, '') AS PositionCode,
                       r.Code AS RoleCode, r.Name AS RoleName,
                       r.Id AS RoleId,
                       p.Type,
                       d.Name AS UnitName,
                       dd.Name AS DepartmentName,
                       s.Code, s.FirstName, s.LastName,
                       s.Gender, cfg.DisplayName AS GenderName,
                       s.UserName, s.Email, s.Phone, s.Mobile,
                       s.SignImage
                FROM dbo.Staff s (NOLOCK)
                LEFT JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = s.Id
                LEFT JOIN dbo.Role r (NOLOCK)          ON r.Id = ros.RoleId
                INNER JOIN dbo.Department d (NOLOCK)    ON d.Id = r.UnitId
                INNER JOIN dbo.Department dd (NOLOCK)   ON dd.Id = ros.DepartmentId
                LEFT  JOIN dbo.Position p (NOLOCK)      ON p.Id = ros.PositionId
                LEFT  JOIN dbo.Configuration cfg (NOLOCK) 
                       ON cfg.Code = 'StaffGender'
                      AND TRY_CAST(cfg.Value AS TINYINT) = s.Gender
                INNER JOIN #RolesNeedTrinhCuc rn
                       ON rn.RoleId = r.Id 
                       AND (rn.RequirePosition IS NULL OR p.Code = rn.RequirePosition) AND (rn.IsLead IS NULL OR p.Type = rn.IsLead)
                WHERE s.IsDeleted = 0
                  AND NOT (p.Code = @PositionCode AND r.Code = @RoleCode AND ros.DepartmentId = @DepartmentId)
                  AND ros.DepartmentId IN (SELECT Id FROM #DeptTreeTrinhCuc)
                  -- Với Phó phòng: chỉ lấy lãnh đạo cấp trên, không lấy lại Trưởng phòng
                  AND NOT (@RoleCode = N'LanhDaoPhong' AND @IsLead = 2 AND ros.DepartmentId = @DepartmentId AND p.Type = 1);

                -- Kiểm tra điều kiện dừng sau mỗi lần insert
                IF @RoleCode = N'LanhDaoPhong' AND @IsLead = 2
                BEGIN
                    -- Kiểm tra lại có Trưởng phòng không (có thể đã có từ lần query đầu)
                    IF @HasTruongPhong = 0
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM #ResultTrinhCuc rt
                            INNER JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = rt.Id AND ros.DepartmentId = rt.DepartmentId
                            INNER JOIN dbo.Position p (NOLOCK) ON p.Id = ros.PositionId
                            WHERE rt.DepartmentId = @DepartmentId AND p.Type = 1
                        )
                            SET @HasTruongPhong = 1;
                    END
                    
                    -- Kiểm tra có lãnh đạo cấp trên không
                    IF EXISTS (
                        SELECT 1 FROM #ResultTrinhCuc rt
                        WHERE rt.RoleId IN (@RoleId_LanhDaoTrungTam, @RoleId_LanhDaoHanhChinh, @RoleId_LanhDaoDonVi)
                    )
                        SET @HasLanhDaoCapTren = 1;
                    
                    -- Với Phó phòng: cần có cả Trưởng phòng và lãnh đạo cấp trên
                    IF @HasTruongPhong = 1 AND @HasLanhDaoCapTren = 1
                        BREAK;
                END
                ELSE
                BEGIN
                    -- Với các trường hợp khác: chỉ cần có ai đó
                    IF EXISTS (SELECT 1 FROM #ResultTrinhCuc)
                        BREAK;
                END

                SET @CurPri = @CurPri + 1;
            END
        END

        SELECT DISTINCT
               Id, DepartmentId, UnitId, PositionId,
               PositionName, PositionCode, RoleCode, RoleName,
               RoleId, PositionType, UnitName, DepartmentName,
               Code, FirstName, LastName,
               Gender, GenderName,
               UserName, Email, Phone, Mobile,
               SignImage
        FROM #ResultTrinhCuc;
        END
        IF(@Type = 'DONG_TRINH_PHONG')
       BEGIN
       
       Declare @ParentIdDongTrinhPhong INT = NULL;
       
       Select top 1 @ParentIdDongTrinhPhong = ParentId from Department where Id = @DepartmentId
       SELECT DISTINCT
            s.Id, 
            ros.DepartmentId,
            r.UnitId, 
            ros.PositionId,
            ISNULL(p.Name, '') AS PositionName,
            d.Name AS UnitName,
            dd.Name AS DepartmentName,
            s.Code, 
            s.FirstName, 
            s.LastName,
            s.Gender, 
            cfg.DisplayName AS GenderName,
            s.UserName, 
            s.Email, 
            s.Phone, 
            s.Mobile,
            s.SignImage,
            r.Code AS RoleCode, 
            r.Name AS RoleName, 
            r.Id AS RoleId
        FROM dbo.Staff s (NOLOCK)
        LEFT JOIN dbo.RoleOfStaff ros (NOLOCK) ON ros.StaffId = s.Id
        LEFT JOIN dbo.Role r (NOLOCK) ON r.Id = ros.RoleId
        INNER JOIN dbo.Department d (NOLOCK) ON d.Id = r.UnitId
        INNER JOIN dbo.Department dd (NOLOCK) ON dd.Id = ros.DepartmentId
        LEFT JOIN dbo.Position p (NOLOCK) ON p.Id = ros.PositionId
        LEFT JOIN dbo.Configuration cfg (NOLOCK) 
               ON cfg.Code = 'StaffGender'
              AND TRY_CAST(cfg.Value AS TINYINT) = s.Gender
        WHERE 
            s.IsDeleted = 0
            AND (
                -- Nếu truyền vào @RoleCode thì lọc theo đúng giá trị đó
                --(@RoleCode IS NOT NULL AND r.Code = @RoleCode) OR
                -- Ngược lại, nếu không truyền thì lọc theo các RoleCode mặc định
                (@RoleCode IS NOT NULL AND r.Code IN ('LanhDaoPhong', 'LanhDaoHanhChinh', 'LanhDaoTrungTam')
                )
            )
            AND (@UnitId IS NULL OR dd.ParentId = @ParentIdDongTrinhPhong)
            AND (@DepartmentId IS NULL OR dd.Id != @DepartmentId);
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(MAX),
                @ErrorNumber INT,
                @ErrorSeverity INT,
                @ErrorState INT,
                @ErrorLine INT,
                @ErrorProcedure NVARCHAR(200);

        SELECT @ErrorNumber    = ERROR_NUMBER(),
               @ErrorSeverity  = ERROR_SEVERITY(),
               @ErrorState     = ERROR_STATE(),
               @ErrorLine      = ERROR_LINE(),
               @ErrorProcedure = ISNULL(ERROR_PROCEDURE(), '-');

        SELECT @ErrorMessage = 
            N'Error %d, Level %d, State %d, Procedure %s, Line %d, Message: '
            + ERROR_MESSAGE();

        IF (@ErrorState = 0) SET @ErrorState = 1;

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState,
                  @ErrorNumber, @ErrorSeverity, @ErrorState,
                  @ErrorProcedure, @ErrorLine);
    END CATCH;

    SET NOCOUNT OFF;
END